#!/bin/bash

# Deploy script for family-expense-tracker
# This script is called by GitHub Actions on the server

set -e

APP_DIR="/opt/family-expense-tracker"

echo "========================================="
echo "Family Expense Tracker - Deploy Script"
echo "========================================="
echo ""

# Check if running as root (not recommended)
if [ "$EUID" -eq 0 ]; then 
   echo "Warning: Running as root. It's better to run as a regular user with docker group access."
fi

# Create directory if doesn't exist
if [ ! -d "$APP_DIR" ]; then
    echo "Creating application directory..."
    sudo mkdir -p "$APP_DIR"
    sudo chown $(whoami):$(whoami) "$APP_DIR"
fi

cd "$APP_DIR"

# Check if it's a git repo
if [ ! -d ".git" ]; then
    echo "Cloning repository..."
    git clone https://github.com/leosauzza/family-expense-tracker.git "$APP_DIR"
fi

# Pull latest changes
echo "Pulling latest changes from GitHub..."
git pull origin main

# Check if .env exists
if [ ! -f ".env" ]; then
    echo ""
    echo "WARNING: .env file not found!"
    echo "Creating from .env.example..."
    echo ""
    echo "========================================="
    echo "IMPORTANT: Please edit .env and set secure passwords!"
    echo "Run: nano /opt/family-expense-tracker/.env"
    echo "========================================="
    echo ""
    cp .env.example .env
fi

echo "Stopping current containers..."
docker compose -f docker-compose.prod.yml down

echo "Building and starting containers..."
docker compose -f docker-compose.prod.yml up -d --build

echo "Cleaning up..."
docker system prune -f

echo ""
echo "========================================="
echo "Deployment completed successfully!"
echo "========================================="
echo ""
echo "Services:"
echo "  - Frontend: http://$(hostname -I | awk '{print $1}')"
echo "  - API: http://$(hostname -I | awk '{print $1}'):8080"
echo ""
