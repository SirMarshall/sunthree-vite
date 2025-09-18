# =================================================================
# backend/server.py
# =================================================================
import sys
import json
import os
import platform
import yt_dlp
import psutil
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def get_config():
    config_path = os.path.join(os.path.dirname(__file__), 'config.json')
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            return json.load(f)
    return {}

def find_mp3_player(target_name):
    """
    Find a USB drive by its volume label or mount point name.
    target_name can be either:
    - A volume label like "7CB2-67CD"
    - A folder name that should exist inside the drive
    """
    if platform.system() == "Windows":
        partitions = psutil.disk_partitions()
        for p in partitions:
            try:
                if 'removable' in p.opts and os.path.isdir(p.mountpoint):
                    # Method 1: Check if target_name matches the drive label (last part of mount point)
                    drive_label = os.path.basename(p.mountpoint.rstrip('\\'))
                    if drive_label == target_name:
                        return p.mountpoint

                    # Method 2: Check if target_name is a folder inside the drive (backward compatibility)
                    if target_name in os.listdir(p.mountpoint):
                        return p.mountpoint
            except Exception:
                continue
        return None
    else: # macOS / Linux
        # Method 1: Look for drive mounted with the target name as volume label
        possible_media_paths = [f"/media/{os.getlogin()}", f"/run/media/{os.getlogin()}", "/media", "/mnt"]

        for base_path in possible_media_paths:
            if os.path.exists(base_path):
                try:
                    for item in os.listdir(base_path):
                        item_path = os.path.join(base_path, item)
                        if os.path.ismount(item_path):
                            # Check if the mount point name matches our target
                            if item == target_name:
                                print(f"Found drive by volume label: {item_path}")
                                return item_path
                except Exception as e:
                    print(f"Error checking {base_path}: {e}")
                    continue

        # Method 2: Use psutil to find all mounted drives and check labels
        try:
            partitions = psutil.disk_partitions()
            for partition in partitions:
                try:
                    # Check if it's a removable/USB device (common filesystem types for USB)
                    if partition.fstype in ['vfat', 'exfat', 'ntfs', 'ext4', 'ext3', 'ext2']:
                        mount_point_name = os.path.basename(partition.mountpoint)
                        if mount_point_name == target_name:
                            print(f"Found drive by psutil: {partition.mountpoint}")
                            return partition.mountpoint
                except Exception as e:
                    continue
        except Exception as e:
            print(f"Error using psutil: {e}")

        # Method 3: Fallback - check if target_name is a folder inside any USB drive
        for base_path in possible_media_paths:
            if os.path.exists(base_path):
                try:
                    for item in os.listdir(base_path):
                        item_path = os.path.join(base_path, item)
                        if os.path.ismount(item_path) and os.path.isdir(item_path):
                            try:
                                if target_name in os.listdir(item_path):
                                    print(f"Found drive by folder inside: {item_path}")
                                    return item_path
                            except Exception:
                                continue
                except Exception:
                    continue

        return None

def download_youtube_audio(url, output_path):
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': os.path.join(output_path, '%(title)s.%(ext)s'),
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info_dict)
        base, _ = os.path.splitext(filename)
        return base + '.mp3'

@app.route('/find-device', methods=['POST'])
def find_device_endpoint():
    try:
        config = get_config()
        target_name = config.get("deviceName", "SUUNTO")
        print(f"Looking for device: '{target_name}'")

        # Debug: List all current mount points
        print("Current mount points:")
        try:
            for partition in psutil.disk_partitions():
                print(f"  {partition.mountpoint} ({partition.fstype})")
        except Exception as e:
            print(f"Error listing partitions: {e}")

        device_path = find_mp3_player(target_name)

        if device_path:
            print(f"Device found at: {device_path}")
            return jsonify({"success": True, "type": "device-found", "path": device_path})
        else:
            print(f"Device '{target_name}' not found")
            return jsonify({"success": False, "type": "device-not-found", "message": "Device not found"})
    except Exception as e:
        print(f"Error in find_device_endpoint: {e}")
        return jsonify({"success": False, "type": "error", "message": str(e)})

@app.route('/download-video', methods=['POST'])
def download_video_endpoint():
    try:
        data = request.json
        url = data.get("url")
        path = data.get("path")
        print(f"Downloading to: {path}")
        downloaded_file = download_youtube_audio(url, output_path=path)
        return jsonify({"success": True, "type": "download-complete", "file": downloaded_file})
    except Exception as e:
        print(f"Error in download_video_endpoint: {e}")
        return jsonify({"success": False, "type": "error", "message": str(e)})

if __name__ == '__main__':
    print("Starting server...")
    app.run(host='127.0.0.1', port=5000, debug=False)
