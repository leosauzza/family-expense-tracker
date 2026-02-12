#!/bin/bash

# Script to restart Docker Compose with rebuild, preserving database volume
# Usage: ./restart.sh

set -e

echo "🛑 Stopping containers..."
docker compose down

echo "🔨 Building and starting containers..."
docker compose up -d --build

echo "⏳ Waiting for services to be healthy..."
sleep 3

echo "✅ Services status:"
docker compose ps

# Get local IP address for network access info
LOCAL_IP=$(ifconfig | grep "inet " | grep -v "127.0.0.1" | head -1 | awk '{print $2}' || echo "unknown")
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "unknown")
fi

echo ""
echo "🌐 Application URLs:"
echo "  Frontend:   http://localhost:3000"
echo "  Backend:    http://localhost:8080"
echo "  Network:    http://${LOCAL_IP}:3000"
echo ""
echo "📄 PDF Parser Service:"
echo "  Health:     http://localhost:3001/health"
echo ""
echo "  ℹ️  The app auto-detects the API server address."
echo "     Works on both localhost and network automatically!"
