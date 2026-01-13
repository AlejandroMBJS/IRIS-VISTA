#!/bin/bash

# IRIS Vista System - Start Script
# This script starts all services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "  IRIS Vista System - Starting Services"
echo "=========================================="
echo ""

cd "$PROJECT_DIR"

# Check if setup has been run
if [ ! -d "data" ]; then
    echo "Error: Setup has not been run. Please run ./scripts/setup.sh first."
    exit 1
fi

# Parse arguments
DETACHED=true
REBUILD=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        -f|--foreground) DETACHED=false ;;
        -b|--build) REBUILD=true ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -f, --foreground  Run in foreground (show logs)"
            echo "  -b, --build       Rebuild images before starting"
            echo "  -h, --help        Show this help message"
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
    shift
done

# Build if requested
if [ "$REBUILD" = true ]; then
    echo "Rebuilding Docker images..."
    docker compose build
fi

# Start services
if [ "$DETACHED" = true ]; then
    echo "Starting services in background..."
    docker compose up -d

    echo ""
    echo "Waiting for services to be ready..."
    sleep 3

    # Check service health
    if docker compose ps | grep -q "healthy\|running"; then
        echo ""
        echo "=========================================="
        echo "  Services Started Successfully!"
        echo "=========================================="
        echo ""
        echo "  Frontend: http://localhost:3007"
        echo "  Backend:  http://localhost:8087"
        echo ""
        echo "To view logs:"
        echo "  docker compose logs -f"
        echo ""
        echo "To stop services:"
        echo "  ./scripts/stop.sh"
        echo ""
    else
        echo ""
        echo "Warning: Some services may not be running properly."
        echo "Check logs with: docker compose logs"
    fi
else
    echo "Starting services in foreground..."
    docker compose up
fi
