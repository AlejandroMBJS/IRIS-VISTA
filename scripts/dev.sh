#!/bin/bash

# IRIS Vista System - Development Script
# This script runs the services locally without Docker

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "  IRIS Vista System - Development Mode"
echo "=========================================="
echo ""

cd "$PROJECT_DIR"

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "Error: Go is not installed. Please install Go first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "Services stopped."
}
trap cleanup EXIT

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Install backend dependencies if needed
cd backend
if [ ! -f "go.sum" ] || [ ! -d "vendor" ]; then
    echo "Installing backend dependencies..."
    go mod download
fi

# Start backend
echo "Starting backend on http://localhost:8080..."
go run . &
BACKEND_PID=$!

cd "$PROJECT_DIR"

# Wait for backend to be ready
echo "Waiting for backend..."
for i in {1..30}; do
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo "Backend is ready!"
        break
    fi
    sleep 1
done

# Start frontend
echo "Starting frontend on http://localhost:3000..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "  Development Environment Ready!"
echo "=========================================="
echo ""
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8080"
echo ""
echo "  Default admin credentials:"
echo "    Employee Number: admin"
echo "    Password: admin123"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for processes
wait
