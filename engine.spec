# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['backend/server.py'],
    pathex=[],
    binaries=[('backend/ffmpeg_binaries/ffmpeg', 'ffmpeg_binaries'), ('backend/ffmpeg_binaries/ffprobe', 'ffmpeg_binaries')],
    datas=[('backend/config.json', '.')],
    hiddenimports=['yt_dlp.extractor', 'yt_dlp.postprocessor'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='engine',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='engine',
)
