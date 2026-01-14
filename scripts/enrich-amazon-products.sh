#!/bin/bash

# IRIS VISTA - Enrich Products with Amazon Mexico Data
# Usage: ./enrich-amazon-products.sh <container_name>
#
# This script fetches current prices and images from Amazon Mexico
# for all products with an ASIN in the database.

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
echo -e "${YELLOW}Fetching prices from:${NC} Amazon Mexico"
echo ""

# Run Python script to fetch Amazon data
CONTAINER="$CONTAINER" DB_PATH="$DB_PATH" python3 << 'PYTHON_SCRIPT'
import subprocess
import time
import re
import os
import json
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

CONTAINER = os.environ.get('CONTAINER', 'iris-vista-backend')
DB_PATH = os.environ.get('DB_PATH', '/app/data/vista.db')

# Headers to mimic a browser
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
    'Accept-Encoding': 'identity',
    'Connection': 'keep-alive',
}

def run_sql(sql):
    cmd = ['docker', 'exec', '-i', CONTAINER, 'sqlite3', '-json', DB_PATH]
    proc = subprocess.run(cmd, input=sql, capture_output=True, text=True)
    if proc.returncode != 0:
        print(f"\033[0;31mSQL Error: {proc.stderr}\033[0m")
        return None
    try:
        return json.loads(proc.stdout) if proc.stdout.strip() else []
    except:
        return []

def run_sql_update(sql):
    cmd = ['docker', 'exec', '-i', CONTAINER, 'sqlite3', DB_PATH]
    proc = subprocess.run(cmd, input=sql, capture_output=True, text=True)
    return proc.returncode == 0

def fetch_amazon_data(asin):
    """Fetch price and image from Amazon Mexico"""
    url = f"https://www.amazon.com.mx/dp/{asin}"

    try:
        req = Request(url, headers=HEADERS)
        with urlopen(req, timeout=15) as response:
            html = response.read().decode('utf-8', errors='ignore')

        # Extract price - try multiple patterns
        price = None
        price_patterns = [
            # Main price patterns
            r'class="a-price-whole"[^>]*>([0-9,]+)</span>',
            r'"priceAmount":([0-9.]+)',
            r'id="priceblock_ourprice"[^>]*>\$([0-9,]+\.?\d*)',
            r'id="priceblock_dealprice"[^>]*>\$([0-9,]+\.?\d*)',
            r'class="a-offscreen">\$([0-9,]+\.?\d*)',
            r'data-a-color="price"[^>]*>\s*\$\s*([0-9,]+\.?\d*)',
            r'"price":"([0-9.]+)"',
            r'sp_detail_price.*?\$([0-9,]+\.?\d*)',
        ]

        for pattern in price_patterns:
            match = re.search(pattern, html)
            if match:
                price_str = match.group(1).replace(',', '')
                try:
                    price = float(price_str)
                    if price > 0:
                        break
                except:
                    continue

        # Extract image URL
        image_url = None
        image_patterns = [
            r'"hiRes":"(https://[^"]+)"',
            r'"large":"(https://[^"]+)"',
            r'id="landingImage"[^>]*src="(https://[^"]+)"',
            r'id="imgBlkFront"[^>]*src="(https://[^"]+)"',
            r'class="a-dynamic-image"[^>]*src="(https://[^"]+)"',
            r'"mainUrl":"(https://[^"]+)"',
        ]

        for pattern in image_patterns:
            match = re.search(pattern, html)
            if match:
                img = match.group(1).replace('\\u002F', '/')
                if 'amazon' in img or 'ssl-images' in img:
                    image_url = img
                    break

        return {
            'price': price,
            'image_url': image_url,
            'url': url,
            'success': True
        }

    except HTTPError as e:
        return {'success': False, 'error': f'HTTP {e.code}'}
    except URLError as e:
        return {'success': False, 'error': str(e.reason)}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def escape_sql(s):
    if s is None:
        return ''
    return str(s).replace("'", "''")

# Get all products with ASIN
print("\033[0;33mFetching products from database...\033[0m")
products = run_sql("SELECT id, sku, name, asin, price, image_url, product_url FROM products WHERE asin IS NOT NULL AND asin != '' ORDER BY id;")

if not products:
    print("\033[0;31mNo products with ASIN found!\033[0m")
    exit(0)

print(f"\033[0;32mFound {len(products)} products with ASIN\033[0m")
print()

updated = 0
failed = 0

for i, product in enumerate(products):
    asin = product.get('asin', '')
    name = product.get('name', '')[:50]
    current_price = product.get('price', 0)

    print(f"\033[0;36m[{i+1}/{len(products)}]\033[0m {asin} - {name}...")

    # Fetch data from Amazon
    data = fetch_amazon_data(asin)

    if data['success']:
        updates = []

        # Update price if found and different
        if data['price'] and data['price'] > 0:
            if abs(data['price'] - current_price) > 0.01:
                updates.append(f"price = {data['price']}")
                print(f"  \033[0;32m✓ Price:\033[0m ${data['price']:.2f} (was ${current_price:.2f})")
            else:
                print(f"  \033[0;33m- Price:\033[0m ${data['price']:.2f} (unchanged)")
        else:
            print(f"  \033[0;31m✗ Price:\033[0m Not found")

        # Update image if found
        if data['image_url']:
            safe_img = escape_sql(data['image_url'])
            updates.append(f"image_url = '{safe_img}'")
            print(f"  \033[0;32m✓ Image:\033[0m Found")
        else:
            print(f"  \033[0;31m✗ Image:\033[0m Not found")

        # Update product URL
        safe_url = escape_sql(data['url'])
        updates.append(f"product_url = '{safe_url}'")

        if updates:
            sql = f"UPDATE products SET {', '.join(updates)}, updated_at = datetime('now') WHERE id = {product['id']};"
            if run_sql_update(sql):
                updated += 1
            else:
                failed += 1
    else:
        print(f"  \033[0;31m✗ Failed:\033[0m {data.get('error', 'Unknown error')}")
        failed += 1

    # Rate limiting - be nice to Amazon
    if i < len(products) - 1:
        time.sleep(1.5)

print()
print("\033[0;36m================================================\033[0m")
print(f"\033[0;32mUpdated: {updated} products\033[0m")
if failed > 0:
    print(f"\033[0;31mFailed: {failed} products\033[0m")
print("\033[0;36m================================================\033[0m")

PYTHON_SCRIPT

echo ""
echo -e "${GREEN}Done!${NC}"
