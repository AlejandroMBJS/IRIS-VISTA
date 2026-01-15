#!/bin/bash

# IRIS VISTA - Enrich Products with Amazon Mexico Data
# Usage: ./enrich-amazon-products.sh <container_name>
#
# This script uses the backend's metadata extraction service to fetch
# current prices and images from Amazon Mexico for all products with ASIN.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -lt 1 ]; then
    echo -e "${RED}Error: Container name required${NC}"
    echo ""
    echo "Usage: $0 <container_name>"
    echo ""
    echo "Example:"
    echo "  $0 iris-vista-backend"
    exit 1
fi

CONTAINER="$1"
DB_PATH="/app/data/vista.db"
# Backend API URL - assumes running on same host
API_URL="${API_URL:-http://localhost:8080}"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo -e "${RED}Error: Container '$CONTAINER' is not running${NC}"
    echo ""
    echo "Available containers:"
    docker ps --format '  {{.Names}}'
    exit 1
fi

echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}  IRIS VISTA - Enrich Amazon Products${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""
echo -e "${YELLOW}Container:${NC} $CONTAINER"
echo -e "${YELLOW}API URL:${NC} $API_URL"
echo ""

# Run the enrichment using the backend's metadata service
CONTAINER="$CONTAINER" DB_PATH="$DB_PATH" API_URL="$API_URL" python3 << 'PYTHON_SCRIPT'
import subprocess
import json
import os
import time
import urllib.request
import urllib.error

CONTAINER = os.environ.get('CONTAINER', 'iris-vista-backend')
DB_PATH = os.environ.get('DB_PATH', '/app/data/vista.db')
API_URL = os.environ.get('API_URL', 'http://localhost:8080')

def run_sql_query(sql):
    """Run SQL query and return JSON results"""
    cmd = ['docker', 'exec', '-i', CONTAINER, 'sqlite3', '-json', DB_PATH]
    proc = subprocess.run(cmd, input=sql, capture_output=True, text=True)
    if proc.returncode != 0:
        print(f"\033[0;31mSQL Error: {proc.stderr}\033[0m")
        return []
    try:
        return json.loads(proc.stdout) if proc.stdout.strip() else []
    except:
        return []

def run_sql_update(sql):
    """Run SQL update"""
    cmd = ['docker', 'exec', '-i', CONTAINER, 'sqlite3', DB_PATH]
    proc = subprocess.run(cmd, input=sql, capture_output=True, text=True)
    return proc.returncode == 0

def escape_sql(s):
    """Escape string for SQL"""
    if s is None:
        return ''
    return str(s).replace("'", "''")

def extract_metadata_via_api(url):
    """Call backend API to extract metadata"""
    try:
        # First try the debug endpoint (no auth required)
        api_endpoint = f"{API_URL}/debug/extract-metadata"
        data = json.dumps({"url": url}).encode('utf-8')

        req = urllib.request.Request(
            api_endpoint,
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )

        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode('utf-8'))
            # Handle both response formats
            if result.get('success') and result.get('data'):
                return result['data']
            elif result.get('metadata'):
                return result['metadata']
    except Exception as e:
        # API call failed, will fall back to direct extraction
        pass

    return None

def extract_metadata_direct(asin):
    """Extract metadata using chromedp headless browser (bypasses CAPTCHA)"""
    try:
        # Use the new chromedp-based endpoint
        api_endpoint = f"{API_URL}/debug/amazon-product"
        data = json.dumps({"asin": asin}).encode('utf-8')

        req = urllib.request.Request(
            api_endpoint,
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )

        with urllib.request.urlopen(req, timeout=60) as response:
            result = json.loads(response.read().decode('utf-8'))
            if result.get('success') and result.get('data'):
                data = result['data']
                # Map to expected format
                return {
                    'title': data.get('title', ''),
                    'price': data.get('price', 0),
                    'image_url': data.get('image_url', ''),
                    'url': data.get('url', ''),
                }
            elif result.get('error'):
                print(f"  \033[0;31mAPI Error: {result['error']}\033[0m")
    except urllib.error.HTTPError as e:
        print(f"  \033[0;31mHTTP Error: {e.code}\033[0m")
    except urllib.error.URLError as e:
        print(f"  \033[0;31mURL Error: {e.reason}\033[0m")
    except Exception as e:
        print(f"  \033[0;31mError: {e}\033[0m")

    return None

# Get all products with ASIN
print("\033[0;33mFetching products from database...\033[0m")
products = run_sql_query("""
    SELECT id, sku, name, asin, price, image_url, product_url
    FROM products
    WHERE asin IS NOT NULL AND asin != ''
    ORDER BY id;
""")

if not products:
    print("\033[0;31mNo products with ASIN found!\033[0m")
    exit(0)

print(f"\033[0;32mFound {len(products)} products with ASIN\033[0m")
print()

updated = 0
failed = 0
skipped = 0

for i, product in enumerate(products):
    asin = product.get('asin', '')
    name = product.get('name', '')[:50]
    current_price = float(product.get('price', 0) or 0)
    product_id = product.get('id')

    print(f"\033[0;36m[{i+1}/{len(products)}]\033[0m {asin} - {name}...")

    # Build Amazon Mexico URL
    amazon_url = f"https://www.amazon.com.mx/dp/{asin}"

    # Try to extract metadata using backend service
    metadata = extract_metadata_direct(asin)

    if metadata:
        updates = []

        # Update price if found
        new_price = metadata.get('price')
        if new_price and new_price > 0:
            if abs(new_price - current_price) > 0.01:
                updates.append(f"price = {new_price}")
                print(f"  \033[0;32m✓ Price:\033[0m ${new_price:.2f} (was ${current_price:.2f})")
            else:
                print(f"  \033[0;33m- Price:\033[0m ${new_price:.2f} (unchanged)")
        else:
            print(f"  \033[0;31m✗ Price:\033[0m Not found")

        # Update image if found
        new_image = metadata.get('image_url')
        if new_image:
            safe_img = escape_sql(new_image)
            updates.append(f"image_url = '{safe_img}'")
            print(f"  \033[0;32m✓ Image:\033[0m Found")
        else:
            print(f"  \033[0;31m✗ Image:\033[0m Not found")

        # Always update product URL
        safe_url = escape_sql(amazon_url)
        updates.append(f"product_url = '{safe_url}'")

        if updates:
            sql = f"UPDATE products SET {', '.join(updates)}, updated_at = datetime('now') WHERE id = {product_id};"
            if run_sql_update(sql):
                updated += 1
            else:
                failed += 1
    else:
        print(f"  \033[0;31m✗ Failed:\033[0m Could not extract metadata")
        # Still update the product URL
        safe_url = escape_sql(amazon_url)
        sql = f"UPDATE products SET product_url = '{safe_url}', updated_at = datetime('now') WHERE id = {product_id};"
        run_sql_update(sql)
        failed += 1

    # Rate limiting
    if i < len(products) - 1:
        time.sleep(2)

print()
print("\033[0;36m================================================\033[0m")
print(f"\033[0;32mUpdated: {updated} products\033[0m")
if failed > 0:
    print(f"\033[0;31mFailed: {failed} products\033[0m")
print("\033[0;36m================================================\033[0m")

PYTHON_SCRIPT

echo ""
echo -e "${GREEN}Done!${NC}"
