# -*- mode: python ; coding: utf-8 -*-

a = Analysis(
    ['server.py'],
    pathex=[],
    # We list all binaries and data files here.
    # The format is ('source_path', 'destination_folder_in_bundle')
    binaries=[
        ('ffmpeg_binaries/ffmpeg', 'ffmpeg_binaries'),
        ('ffmpeg_binaries/ffprobe', 'ffmpeg_binaries')
    ],
    datas=[
        ('config.json', '.') # Puts config.json in the root of the bundle
    ],
    # All your hidden imports go here.
    hiddenimports=[
        'yt_dlp.extractor',
        'yt_dlp.postprocessor'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
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
    upx_exclude=[],
    # This automatically runs the app without a console window on Windows
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    runtime_tmpdir='.'

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
