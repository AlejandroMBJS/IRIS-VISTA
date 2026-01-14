#!/bin/bash

# IRIS VISTA - Database Reset Script
# Usage: ./db-reset.sh [OPTIONS]

set -e

# Default container name (can be overridden with -c flag)
CONTAINER="iris-vista-backend-1"
DB_PATH="/app/data/vista.db"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

show_help() {
    echo "IRIS VISTA - Database Reset Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -c, --container NAME    Container name (default: iris-vista-backend-1)"
    echo "  -r, --requests          Delete all requests (keeps users & products)"
    echo "  -n, --notifications     Delete notifications only"
    echo "  -t, --cart              Delete cart items only"
    echo "  -l, --logs              Delete activity logs only"
    echo "  -a, --audit             Delete audit logs only"
    echo "  -p, --products          Delete products/inventory only"
    echo "  -d, --delivered         Reset delivered orders to purchased"
    echo "  -u, --users             Delete users (except admin)"
    echo "  --reset-keep-admin      Reset everything but keep admin user"
    echo "  --reset-all             Complete reset (recreates admin on restart)"
    echo "  --count                 Show row counts for all tables"
    echo "  --tables                List all tables"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -p                   # Delete all products"
    echo "  $0 -r -n                # Delete requests and notifications"
    echo "  $0 -c mycontainer -p    # Use custom container name"
    echo "  $0 --reset-keep-admin   # Full reset keeping admin user"
}

run_sql() {
    docker exec -it "$CONTAINER" sqlite3 "$DB_PATH" "$1"
}

confirm() {
    echo -e "${YELLOW}Warning: This will permanently delete data!${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
}

delete_requests() {
    echo -e "${YELLOW}Deleting all requests...${NC}"
    run_sql "
    DELETE FROM request_histories;
    DELETE FROM purchase_request_items;
    DELETE FROM purchase_requests;
    DELETE FROM cart_items;
    DELETE FROM notifications;
    DELETE FROM activity_logs;
    "
    echo -e "${GREEN}✓ Requests deleted${NC}"
}

delete_notifications() {
    echo -e "${YELLOW}Deleting notifications...${NC}"
    run_sql "DELETE FROM notifications;"
    echo -e "${GREEN}✓ Notifications deleted${NC}"
}

delete_cart() {
    echo -e "${YELLOW}Deleting cart items...${NC}"
    run_sql "DELETE FROM cart_items;"
    echo -e "${GREEN}✓ Cart items deleted${NC}"
}

delete_logs() {
    echo -e "${YELLOW}Deleting activity logs...${NC}"
    run_sql "DELETE FROM activity_logs;"
    echo -e "${GREEN}✓ Activity logs deleted${NC}"
}

delete_audit() {
    echo -e "${YELLOW}Deleting audit logs...${NC}"
    run_sql "DELETE FROM audit_logs;"
    echo -e "${GREEN}✓ Audit logs deleted${NC}"
}

delete_products() {
    echo -e "${YELLOW}Deleting products/inventory...${NC}"
    run_sql "
    DELETE FROM product_images;
    DELETE FROM products;
    "
    echo -e "${GREEN}✓ Products deleted${NC}"
}

reset_delivered() {
    echo -e "${YELLOW}Resetting delivered orders to purchased...${NC}"
    run_sql "UPDATE purchase_requests SET status = 'purchased' WHERE status = 'delivered';"
    echo -e "${GREEN}✓ Delivered orders reset${NC}"
}

delete_users() {
    echo -e "${YELLOW}Deleting users (except admin)...${NC}"
    run_sql "DELETE FROM users WHERE employee_number != 'admin';"
    echo -e "${GREEN}✓ Users deleted${NC}"
}

reset_keep_admin() {
    echo -e "${YELLOW}Resetting everything (keeping admin)...${NC}"
    run_sql "
    DELETE FROM request_histories;
    DELETE FROM purchase_request_items;
    DELETE FROM purchase_requests;
    DELETE FROM cart_items;
    DELETE FROM notifications;
    DELETE FROM activity_logs;
    DELETE FROM audit_logs;
    DELETE FROM product_images;
    DELETE FROM products;
    DELETE FROM users WHERE employee_number != 'admin';
    "
    echo -e "${GREEN}✓ Full reset complete (admin kept)${NC}"
}

reset_all() {
    echo -e "${YELLOW}Complete reset...${NC}"
    run_sql "
    DELETE FROM request_histories;
    DELETE FROM purchase_request_items;
    DELETE FROM purchase_requests;
    DELETE FROM cart_items;
    DELETE FROM notifications;
    DELETE FROM activity_logs;
    DELETE FROM audit_logs;
    DELETE FROM product_images;
    DELETE FROM products;
    DELETE FROM users;
    "
    echo -e "${GREEN}✓ Complete reset done (admin will be recreated on restart)${NC}"
}

show_counts() {
    echo -e "${YELLOW}Table row counts:${NC}"
    run_sql "
    SELECT 'users' as [table], COUNT(*) as [count] FROM users
    UNION ALL SELECT 'products', COUNT(*) FROM products
    UNION ALL SELECT 'product_images', COUNT(*) FROM product_images
    UNION ALL SELECT 'purchase_requests', COUNT(*) FROM purchase_requests
    UNION ALL SELECT 'purchase_request_items', COUNT(*) FROM purchase_request_items
    UNION ALL SELECT 'request_histories', COUNT(*) FROM request_histories
    UNION ALL SELECT 'cart_items', COUNT(*) FROM cart_items
    UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
    UNION ALL SELECT 'activity_logs', COUNT(*) FROM activity_logs
    UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs;
    "
}

show_tables() {
    echo -e "${YELLOW}Database tables:${NC}"
    run_sql ".tables"
}

# Parse arguments
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

ACTIONS=()

while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--container)
            CONTAINER="$2"
            shift 2
            ;;
        -r|--requests)
            ACTIONS+=("requests")
            shift
            ;;
        -n|--notifications)
            ACTIONS+=("notifications")
            shift
            ;;
        -t|--cart)
            ACTIONS+=("cart")
            shift
            ;;
        -l|--logs)
            ACTIONS+=("logs")
            shift
            ;;
        -a|--audit)
            ACTIONS+=("audit")
            shift
            ;;
        -p|--products)
            ACTIONS+=("products")
            shift
            ;;
        -d|--delivered)
            ACTIONS+=("delivered")
            shift
            ;;
        -u|--users)
            ACTIONS+=("users")
            shift
            ;;
        --reset-keep-admin)
            ACTIONS+=("reset-keep-admin")
            shift
            ;;
        --reset-all)
            ACTIONS+=("reset-all")
            shift
            ;;
        --count)
            show_counts
            exit 0
            ;;
        --tables)
            show_tables
            exit 0
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Execute actions
if [ ${#ACTIONS[@]} -eq 0 ]; then
    echo -e "${RED}No action specified${NC}"
    show_help
    exit 1
fi

echo -e "${YELLOW}Container: $CONTAINER${NC}"
echo -e "${YELLOW}Actions: ${ACTIONS[*]}${NC}"
confirm

for action in "${ACTIONS[@]}"; do
    case $action in
        requests) delete_requests ;;
        notifications) delete_notifications ;;
        cart) delete_cart ;;
        logs) delete_logs ;;
        audit) delete_audit ;;
        products) delete_products ;;
        delivered) reset_delivered ;;
        users) delete_users ;;
        reset-keep-admin) reset_keep_admin ;;
        reset-all) reset_all ;;
    esac
done

echo -e "${GREEN}Done!${NC}"
