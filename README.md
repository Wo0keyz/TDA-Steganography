# Steganography Toolkit

A small toolkit to hide and retrieve secret messages inside images, audio files and text.

## ✅ Web interface (recommended)
A modern web interface is available under `server/` and supports:

- **Image steganography** (PNG/JPG) using LSB encoding - dedicated page at `/image`
- **Audio steganography** (WAV) using LSB encoding - dedicated page at `/audio`
- **Text steganography** using zero-width characters embedded in a text file - dedicated page at `/text`

### Run the web app

1. Install dependencies:

```bash
python3 -m pip install -r requirements.txt
```

2. Start the server:

```bash
python3 server/app.py
```

3. Open a browser at: `http://localhost:5000`

Navigate to the dedicated pages for each steganography type. For images, you can view the original and encoded images side-by-side on the page before downloading.

## 🔧 CLI tools (legacy)
The `Steganography-Tools/` directory contains command-line scripts you can run directly.

```bash
cd Steganography-Tools
./script.sh
./main.py
```

> Note: The CLI scripts are still functional but are now considered legacy in favor of the web UI.

## 📝 Notes

- The web UI processes uploads on the server and does not persist any files after processing.
- Make sure that the files you upload are in a compatible format (PNG/JPG for images, WAV for audio, TXT for text).
