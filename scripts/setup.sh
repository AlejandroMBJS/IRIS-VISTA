#!/bin/bash

# IRIS Vista System - Setup Script
# This script initializes the development environment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "  IRIS Vista System - Setup"
echo "=========================================="
echo ""

cd "$PROJECT_DIR"

# Create data directory for persistent database
echo "[1/4] Creating data directory..."
mkdir -p data

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "Error: Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Create .env file if it doesn't exist
echo "[2/4] Setting up environment variables..."
if [ ! -f .env ]; then
    cat > .env << 'EOF'
# IRIS Vista Environment Configuration
# Generate secure keys for production!

JWT_SECRET=your-super-secret-key-change-in-production
ENCRYPTION_KEY=32-byte-long-key-for-aes256!!!!!

# Optional: Override ports
# BACKEND_PORT=8080
# FRONTEND_PORT=3000
EOF
    echo "Created .env file with default values"
    echo "WARNING: Please update the JWT_SECRET and ENCRYPTION_KEY for production!"
else
    echo ".env file already exists, skipping..."
fi

# Build Docker images
echo "[3/4] Building Docker images..."
docker compose build

# Initialize database (first run)
echo "[4/4] Setup complete!"
echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "To start the services, run:"
echo "  ./scripts/start.sh"
echo ""
echo "Or using Docker Compose directly:"
echo "  docker compose up -d"
echo ""
echo "Services will be available at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8080"
echo ""
echo "Default admin credentials:"
echo "  Employee Number: admin"
echo "  Password: admin123"
echo ""
