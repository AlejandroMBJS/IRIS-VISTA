#!/bin/bash

# IRIS VISTA - Import Products from Amazon Business CSV
# Usage: ./import-csv-products.sh <container_name>
#
# This script imports products from the Amazon Business CSV that have
# quantity >= 2, with mock stock quantities (100 units each).

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
CSV_FILE="/home/iamx/iris-vista/pedidos_de_20251021_para_20260113_20260113_1130.csv"
DB_PATH="/app/data/vista.db"
MOCK_STOCK=100

# Check arguments
if [ $# -lt 1 ]; then
    echo -e "${RED}Error: Container name required${NC}"
    echo ""
    echo "Usage: $0 <container_name>"
    echo ""
    echo "Example:"
    echo "  $0 iris-vista-backend-1"
    exit 1
fi

CONTAINER="$1"

# Check if CSV file exists
if [ ! -f "$CSV_FILE" ]; then
    echo -e "${RED}Error: CSV file not found: $CSV_FILE${NC}"
    exit 1
fi

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo -e "${RED}Error: Container '$CONTAINER' is not running${NC}"
    echo ""
    echo "Available containers:"
    docker ps --format '  {{.Names}}'
    exit 1
fi

echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}  IRIS VISTA - Import Products from CSV${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""
echo -e "${YELLOW}Container:${NC} $CONTAINER"
echo -e "${YELLOW}CSV File:${NC} $CSV_FILE"
echo -e "${YELLOW}Mock Stock:${NC} $MOCK_STOCK units"
echo ""

# Run Python script to parse CSV and import products
CONTAINER="$CONTAINER" DB_PATH="$DB_PATH" MOCK_STOCK="$MOCK_STOCK" python3 << 'PYTHON_SCRIPT'
import csv
import subprocess
import os

CSV_FILE = "/home/iamx/iris-vista/pedidos_de_20251021_para_20260113_20260113_1130.csv"
CONTAINER = os.environ.get('CONTAINER', 'iris-vista-backend-1')
DB_PATH = os.environ.get('DB_PATH', '/app/data/vista.db')
MOCK_STOCK = int(os.environ.get('MOCK_STOCK', '100'))

def escape_sql(s):
    if s is None:
        return ''
    return str(s).replace("'", "''")

def run_sql(sql):
    cmd = ['docker', 'exec', '-i', CONTAINER, 'sqlite3', DB_PATH]
    proc = subprocess.run(cmd, input=sql, capture_output=True, text=True)
    if proc.returncode != 0 and proc.stderr:
        print(f"\033[0;31mSQL Error: {proc.stderr}\033[0m")
    return proc.returncode == 0

# Read and parse CSV
seen_asins = set()
products = []

print(f"\033[0;33mParsing CSV file...\033[0m")

with open(CSV_FILE, 'r', encoding='utf-8-sig') as f:
    reader = csv.reader(f)
    header = next(reader)  # Skip header

    for row in reader:
        if len(row) < 41:
            continue

        try:
            asin = row[23].strip()
            title = row[24].strip()[:250]
            brand = row[31].strip()[:100]
            category = row[22].strip()[:100]

            # Parse price
            price_str = row[37].strip().replace('"', '').replace('=', '')
            try:
                price = float(price_str) if price_str and price_str != 'NA' else 0
            except:
                price = 0

            # Parse quantity (column 40: Cantidad de producto)
            qty_str = row[40].strip()
            try:
                qty = int(qty_str) if qty_str else 0
            except:
                qty = 0

            # Filter: qty >= 2 and valid ASIN
            if qty < 2:
                continue
            if not asin or asin == 'ASIN':
                continue
            if asin in seen_asins:
                continue

            seen_asins.add(asin)
            products.append({
                'asin': asin,
                'title': title,
                'brand': brand,
                'category': category,
                'price': price,
                'qty': qty
            })

        except Exception as e:
            continue

print(f"\033[0;32mFound {len(products)} unique products with qty >= 2\033[0m")
print()

if not products:
    print("\033[0;31mNo products found to import!\033[0m")
    exit(0)

# Build SQL statements
sql_statements = []
for p in products:
    sku = f"AMZ-{p['asin']}"
    safe_title = escape_sql(p['title'])
    safe_brand = escape_sql(p['brand'])
    safe_category = escape_sql(p['category'])

    sql = f"""INSERT OR REPLACE INTO products (sku, name, category, brand, price, currency, stock, asin, source, is_active, is_ecommerce, product_url, created_at, updated_at)
VALUES ('{sku}', '{safe_title}', '{safe_category}', '{safe_brand}', {p['price']}, 'MXN', {MOCK_STOCK}, '{p['asin']}', 'internal', 1, 1, 'https://www.amazon.com.mx/dp/{p['asin']}', datetime('now'), datetime('now'));"""
    sql_statements.append(sql)

    # Truncate title for display
    display_title = p['title'][:55] + '...' if len(p['title']) > 55 else p['title']
    print(f"  \033[0;32m+\033[0m [{p['asin']}] {display_title} (qty: {p['qty']}, ${p['price']:.2f})")

print()
print(f"\033[0;33mImporting {len(products)} products into database...\033[0m")

# Execute SQL
full_sql = '\n'.join(sql_statements)
if run_sql(full_sql):
    print(f"\033[0;32mSuccessfully imported {len(products)} products!\033[0m")
else:
    print(f"\033[0;31mFailed to import some products\033[0m")
    exit(1)

# Show final count
print()
print(f"\033[0;36mTotal products in database:\033[0m")
count_sql = "SELECT 'Total: ' || COUNT(*) FROM products; SELECT 'External: ' || COUNT(*) FROM products WHERE source = 'external';"
subprocess.run(['docker', 'exec', '-i', CONTAINER, 'sqlite3', DB_PATH, count_sql])

PYTHON_SCRIPT

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Import Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
