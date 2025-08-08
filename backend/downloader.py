import yt_dlp
import os
import sys
import psutil
import platform # Import the platform module

def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        # If not in PyInstaller bundle, we are in development
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)
# --- OS-specific imports ---
# WMI is only available on Windows, so we'll only import it there.
if platform.system() == "Windows":
    try:
        import wmi
    except ImportError:
        # This will be handled in the find function
        wmi = None 

def find_mp3_player(target_name="SUUNTO"):
    """
    Finds a removable drive with a specific volume name (e.g., "SUUNTO").
    This function is now cross-platform and works on Linux and Windows.
    Returns the drive's mount point (e.g., "E:\" or "/media/user/SUUNTO").
    """
    os_type = platform.system()

    if os_type == "Windows":
        print("Searching for device on Windows...")
        if not wmi:
            print("WMI module not found. Cannot search for drive by name on Windows.")
            print("Please install it using: pip install WMI")
            return None
        
        c = wmi.WMI()
        # Query for removable drives
        for drive in c.Win32_LogicalDisk(DriveType=2): # DriveType=2 is for removable disks
            if drive.VolumeName and drive.VolumeName.upper() == target_name.upper():
                # drive.DeviceID is the drive letter, like "E:"
                return drive.DeviceID + os.sep 
        return None

    elif os_type == "Linux":
        print("Searching for device on Linux...")
        label_path = os.path.join("/dev/disk/by-label/", target_name)
        
        if os.path.exists(label_path):
            # Find the actual device path (e.g., /dev/sdb1)
            device_path = os.path.realpath(label_path)
            
            # Now find where this device is mounted
            for part in psutil.disk_partitions():
                if part.device == device_path:
                    # part.mountpoint is the path we need (e.g., /media/boris/SUUNTO)
                    return part.mountpoint
        return None

    else:
        print(f"Unsupported OS: {os_type}. Cannot auto-detect device.")
        return None

def get_ffmpeg_path():
    """Determines the path to FFmpeg when bundled with PyInstaller."""
    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.abspath(".")
    
    return os.path.join(base_path, 'ffmpeg_binaries', 'ffmpeg') 

def get_ffprobe_path():
    """Determines the path to ffprobe when bundled with PyInstaller."""
    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, 'ffmpeg_binaries', 'ffprobe')


def download_youtube_audio(url, output_path='downloads', preferred_quality='192'):
    """
    Downloads audio from a YouTube URL to the specified output path.
    """
    if not os.path.exists(output_path):
        os.makedirs(output_path)
        
    # --- THIS IS THE UPGRADED PART ---
    # Define the base names of our tools
    ffmpeg_name = "ffmpeg"
    ffprobe_name = "ffprobe"
    
    # On Windows, they have .exe. Let's add it if needed.
    if platform.system() == "Windows":
        ffmpeg_name += ".exe"
        ffprobe_name += ".exe"

    # Now we find their TRUE path using our glorious function!
    ffmpeg_path = resource_path(os.path.join("ffmpeg_binaries", ffmpeg_name))
    ffprobe_path = resource_path(os.path.join("ffmpeg_binaries", ffprobe_name))
    # --- END OF UPGRADE ---

    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': preferred_quality,
        }],
        'outtmpl': os.path.join(output_path, '%(title)s.%(ext)s'),
        'verbose': True,
        'noplaylist': True,
        'ignoreerrors': True,
        # Use our new, brilliant paths!
        'ffmpeg_location': ffmpeg_path,
        'ffprobe_location': ffprobe_path,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        print(f"\nSuccessfully downloaded audio from: {url}")
        print(f"File saved to: {output_path}")
    except Exception as e:
        print(f"\nError downloading audio from {url}: {e}")

if __name__ == "__main__":
    mp3_player_path = find_mp3_player("SUUNTO")

    if mp3_player_path:
        print(f"MP3 Player 'SUUNTO' detected at: {mp3_player_path}")
        music_folder = os.path.join(mp3_player_path, "Music")
        if os.path.isdir(music_folder):
            download_path = music_folder
        else:
            download_path = mp3_player_path
    else:
        print("MP3 Player 'SUUNTO' not detected.")
        print("Files will be saved to the local 'downloads' folder.")
        download_path = 'downloads'
    
    youtube_url = input("Enter the YouTube URL: ")
    if youtube_url:
        download_youtube_audio(youtube_url, output_path=download_path)