#!/bin/bash

# IRIS Vista System - Stop Script
# This script stops all services

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "  IRIS Vista System - Stopping Services"
echo "=========================================="
echo ""

cd "$PROJECT_DIR"

# Parse arguments
REMOVE_VOLUMES=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        -v|--volumes) REMOVE_VOLUMES=true ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -v, --volumes  Also remove volumes (WARNING: deletes database!)"
            echo "  -h, --help     Show this help message"
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
    shift
done

# Stop services
echo "Stopping services..."

if [ "$REMOVE_VOLUMES" = true ]; then
    echo "WARNING: Removing volumes will delete the database!"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker compose down -v
        echo "Services stopped and volumes removed."
    else
        echo "Operation cancelled."
        exit 0
    fi
else
    docker compose down
fi

echo ""
echo "=========================================="
echo "  Services Stopped"
echo "=========================================="
echo ""
echo "Database and data are preserved in ./data/"
echo ""
echo "To start again:"
echo "  ./scripts/start.sh"
echo ""
