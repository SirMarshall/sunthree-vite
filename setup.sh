#!/bin/bash

set -e

echo "🚀 Setting up Sunthree Vite development environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this from the project root."
    exit 1
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
if command -v pnpm &> /dev/null; then
    pnpm install
else
    npm install
fi

# Setup Python virtual environment
echo "🐍 Setting up Python virtual environment..."
cd backend

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo "✅ Created Python virtual environment"
fi

# Activate virtual environment
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    source .venv/Scripts/activate
else
    source .venv/bin/activate
fi

# Install Python dependencies
if [ -f "requirements.txt" ]; then
    echo "📚 Installing Python dependencies..."
    pip install -r requirements.txt
else
    echo "⚠️  No requirements.txt found, installing basic dependencies..."
    pip install flask flask-cors yt-dlp psutil pyinstaller
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🛠️  Available commands:"
echo "  pnpm run dev          - Start development server"
echo "  pnpm run build:linux  - Build Linux AppImage"
echo "  pnpm run build:win    - Build Windows executable"
echo "  pnpm run build:mac    - Build macOS app"
echo ""
echo "🔧 Before building, make sure to:"
echo "  1. Update backend/config.json with your device name"
echo "  2. Test with 'pnpm run dev' first"
echo ""