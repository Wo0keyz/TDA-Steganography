import io
import os
import sys
import traceback

# Ensure imports work when this module is executed from the server/ directory.
# The shared helpers are located at the repository root.
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from flask import Flask, jsonify, render_template, request, send_file

from stego_web_utils import (
    decode_audio_bytes,
    decode_image_bytes,
    decode_text,
    encode_audio_bytes,
    encode_image_bytes,
    encode_text,
)

app = Flask(__name__, template_folder="templates", static_folder="static")


def _error_response(message, status=400):
    return jsonify({"error": message}), status


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/image")
def image_page():
    return render_template("image.html")


@app.route("/audio")
def audio_page():
    return render_template("audio.html")


@app.route("/text")
def text_page():
    return render_template("text.html")


@app.route("/api/encode", methods=["POST"])
def api_encode():
    mode = request.form.get("mode")
    message = request.form.get("message", "")
    cover = request.files.get("coverFile")
    output_name = request.form.get("outputName") or "stego"

    if not mode:
        return _error_response("Missing mode")

    if mode not in ("image", "audio", "text"):
        return _error_response("Unknown mode")

    if not cover or cover.filename == "":
        return _error_response("No file uploaded")

    try:
        data = cover.read()
        if mode == "image":
            out_bytes = encode_image_bytes(data, message)
            filename = f"{output_name}.png"
            mimetype = "image/png"
        elif mode == "audio":
            out_bytes = encode_audio_bytes(data, message)
            filename = f"{output_name}.wav"
            mimetype = "audio/wav"
        else:
            # text
            text = data.decode("utf-8", errors="replace")
            out_text = encode_text(text, message)
            out_bytes = out_text.encode("utf-8")
            filename = f"{output_name}.txt"
            mimetype = "text/plain"

        return send_file(
            io.BytesIO(out_bytes),
            as_attachment=True,
            download_name=filename,
            mimetype=mimetype,
        )
    except Exception as e:
        traceback.print_exc()
        return _error_response(str(e))


@app.route("/api/decode", methods=["POST"])
def api_decode():
    mode = request.form.get("mode")
    stego = request.files.get("stegoFile")

    if not mode:
        return _error_response("Missing mode")
    if mode not in ("image", "audio", "text"):
        return _error_response("Unknown mode")
    if not stego or stego.filename == "":
        return _error_response("No file uploaded")

    try:
        data = stego.read()
        if mode == "image":
            message = decode_image_bytes(data)
        elif mode == "audio":
            message = decode_audio_bytes(data)
        else:
            text = data.decode("utf-8", errors="replace")
            message = decode_text(text)

        return jsonify({"message": message})
    except Exception as e:
        traceback.print_exc()
        return _error_response(str(e))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
