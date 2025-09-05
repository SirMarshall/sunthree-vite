#!/bin/sh

set -e

# --- New: Clean PyInstaller output and work directories ---
echo "INFO: Cleaning PyInstaller output and work directories..."
# Remove the distpath and workpath to ensure a clean build
rm -rf ./build/engine
rm -rf ./build/pyinstaller-work
echo "SUCCESS: Directories cleaned."
# --- End New ---


# Determine the PyInstaller executable path based on OS
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
  # Windows (Git Bash/MSYS2/Cygwin environments)
  PYINSTALLER_EXEC="./backend/venv/Scripts/pyinstaller.exe"
else
  # Linux / macOS
  PYINSTALLER_EXEC="./backend/venv/bin/pyinstaller"
fi

# Ensure the executable exists before trying to run it
if [ ! -f "$PYINSTALLER_EXEC" ]; then
  echo "❌ Error: PyInstaller executable not found at $PYINSTALLER_EXEC"
  echo "Please ensure PyInstaller is installed in the virtual environment."
  exit 1
fi

echo "INFO: Building Python engine with PyInstaller..."

"$PYINSTALLER_EXEC" \
  --distpath ./build/engine \
  --workpath ./build/pyinstaller-work \
  ./backend/engine.spec

echo "SUCCESS: PyInstaller finished."

# Set execute permissions only on Linux/macOS
if [[ "$OSTYPE" != "msys" && "$OSTYPE" != "cygwin" && "$OSTYPE" != "win32" ]]; then
  echo "INFO: Setting execute permissions on the engine file..."
  chmod +x ./build/engine/engine # Assuming 'engine' is the name of the built executable
  echo "SUCCESS: Permissions set on build/engine/engine."
else
  echo "INFO: Skipping execute permissions for Windows (not required)."
fi
