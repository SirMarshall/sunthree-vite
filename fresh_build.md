# Build Commands Reference

## Fresh Setup (after clone/checkout)
```bash
# Install Node.js dependencies
pnpm install  # or npm install

# Setup Python environment
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

## Clean Build (removes all artifacts first)
```bash
# Full clean and rebuild
rm -rf build dist out node_modules/.cache
pnpm run build:linux    # or build:win, build:mac
```

## Development
```bash
pnpm run dev            # Start development with hot reload
```

## Production Builds
```bash
# Linux AppImage
pnpm run build:linux

# Windows executable  
pnpm run build:win

# macOS app
pnpm run build:mac

# Just build without packaging
pnpm run build:unpack
```

## Rebuild Python Engine Only
```bash
# If you only changed Python code
sh ./scripts/build-engine.sh
```

## Testing the Built App
```bash
# Test the unpacked version
./dist/linux-unpacked/sunthree-vite

# Test the AppImage
./dist/Sunthree\ Vite-1.0.0.AppImage
```

## Troubleshooting
```bash
# Clear all caches and rebuild
rm -rf build dist out node_modules/.cache backend/venv
pnpm install
cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt && cd ..
pnpm run build:linux
```