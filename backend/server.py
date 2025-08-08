# =================================================================
# backend/server.py -- THE FINAL, ENLIGHTENED SOLDIER --
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
CORS(app)  # Allow Electron renderer to make requests

def get_config():
    # The path to the config is now relative to this script.
    config_path = os.path.join(os.path.dirname(__file__), 'config.json')
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            return json.load(f)
    return {}

def find_mp3_player(target_name):
    if platform.system() == "Windows":
        partitions = psutil.disk_partitions()
        for p in partitions:
            try:
                if 'removable' in p.opts and os.path.isdir(p.mountpoint):
                    if target_name in os.listdir(p.mountpoint):
                         return p.mountpoint
            except Exception:
                continue
        return None
    else: # macOS / Linux
        possible_media_paths = [f"/media/{os.getlogin()}", f"/run/media/{os.getlogin()}"]
        for path in possible_media_paths:
            if os.path.exists(path):
                for item in os.listdir(path):
                    if item == target_name:
                        return os.path.join(path, item)
        return None

def download_youtube_audio(url, output_path='downloads'):
    os.makedirs(output_path, exist_ok=True)
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
        device_path = find_mp3_player(target_name)
        
        if device_path:
            return jsonify({"success": True, "type": "device-found", "path": device_path})
        else:
            return jsonify({"success": False, "type": "device-not-found", "message": "Device not found"})
    except Exception as e:
        return jsonify({"success": False, "type": "error", "message": str(e)})

@app.route('/download-video', methods=['POST'])
def download_video_endpoint():
    try:
        data = request.json
        url = data.get("url")
        path = data.get("path")
        downloaded_file = download_youtube_audio(url, output_path=path)
        return jsonify({"success": True, "type": "download-complete", "file": downloaded_file})
    except Exception as e:
        return jsonify({"success": False, "type": "error", "message": str(e)})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)
