#!/bin/bash

echo "🧹 Cleaning up project before commit..."

# Remove build artifacts
rm -rf build/
rm -rf dist/
rm -rf out/

# Remove the wrong venv (keep backend/venv)
rm -rf venv/

# Remove node_modules if it exists (will be reinstalled)
rm -rf node_modules/

# Remove Python cache
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true

# Remove editor/IDE files
rm -rf .vscode/ 2>/dev/null || true
rm -f .DS_Store 2>/dev/null || true

echo "✅ Cleanup complete!"
echo "Now you can commit with: git add . && git commit -m 'Working Electron+Vite+React+Python app with USB detection'"