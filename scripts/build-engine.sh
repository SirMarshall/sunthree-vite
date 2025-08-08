#!/bin/sh

set -e

PYINSTALLER_EXEC="./backend/venv/bin/pyinstaller"

echo "INFO: Building Python engine with PyInstaller..."

"$PYINSTALLER_EXEC" \
  --distpath ./build/engine \
  --workpath ./build/pyinstaller-work \
  ./backend/engine.spec

echo "SUCCESS: PyInstaller finished."

echo "INFO: Setting execute permissions on the engine file..."
chmod +x ./build/engine/engine
echo "SUCCESS: Permissions set on build/engine/engine."