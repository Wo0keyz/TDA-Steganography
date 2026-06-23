import importlib.util
import io
import os
import wave

import cv2
import numpy as np

# The original steganography helper modules are located under "Steganography-Tools".
# This directory name is not a valid Python package name, so we load constants via importlib.
spec = importlib.util.spec_from_file_location(
    "stego_constants",
    os.path.join(os.path.dirname(__file__), "Steganography-Tools", "constants.py"),
)
stego_constants = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stego_constants)

END_MARKER = stego_constants.END_MARKER
TEXT_STOP_BITS = stego_constants.TEXT_STOP_BITS
ZWC_MAP = stego_constants.ZWC_MAP
ZWC_REVERSE = stego_constants.ZWC_REVERSE


def encode_image_bytes(image_bytes: bytes, message: str) -> bytes:
    """Encode a message into an image using LSB steganography.

    The returned image is PNG encoded to preserve stego data.
    """

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Unable to decode the uploaded image. Make sure it is a valid PNG/JPG.")

    data = message + END_MARKER
    binary = "".join(format(ord(c), "08b") for c in data)
    capacity = img.shape[0] * img.shape[1] * 3
    if len(binary) > capacity:
        raise ValueError(
            f"Message too large for image. Capacity is {capacity} bits but message needs {len(binary)} bits."
        )

    idx = 0
    for row in img:
        for pixel in row:
            for c in range(3):
                if idx < len(binary):
                    # Ensure operations stay in the 0-255 range for uint8.
                    bit = int(binary[idx])
                    pixel[c] = (int(pixel[c]) & 0xFE) | bit
                    idx += 1

    ret, buf = cv2.imencode(".png", img)
    if not ret:
        raise RuntimeError("Failed to encode image.")
    return buf.tobytes()


def decode_image_bytes(image_bytes: bytes) -> str:
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Unable to decode the uploaded image. Make sure it is a valid PNG/JPG.")

    bits = []
    for row in img:
        for pixel in row:
            for c in range(3):
                bits.append(str(pixel[c] & 1))

    bits = "".join(bits)
    chars = [bits[i : i + 8] for i in range(0, len(bits), 8)]

    result = []
    for ch in chars:
        try:
            result.append(chr(int(ch, 2)))
        except ValueError:
            break
        if len(result) >= len(END_MARKER) and "".join(result).endswith(END_MARKER):
            return "".join(result).rstrip(END_MARKER)

    raise ValueError("End marker not found. The image does not appear to contain a hidden message.")


def encode_audio_bytes(wav_bytes: bytes, message: str) -> bytes:
    """Encode a message into a WAV file using LSB steganography on the raw frames."""

    in_buf = io.BytesIO(wav_bytes)
    with wave.open(in_buf, "rb") as w:
        params = w.getparams()
        frames = bytearray(w.readframes(w.getnframes()))

    data = message + END_MARKER
    bits = "".join(format(ord(c), "08b") for c in data)

    if len(bits) > len(frames):
        raise ValueError(
            f"Message too large for audio. Capacity is {len(frames)} bits but message needs {len(bits)} bits."
        )

    for i, bit in enumerate(bits):
        frames[i] = (frames[i] & 254) | int(bit)

    out_buf = io.BytesIO()
    with wave.open(out_buf, "wb") as w:
        w.setparams(params)
        w.writeframes(frames)

    return out_buf.getvalue()


def decode_audio_bytes(wav_bytes: bytes) -> str:
    in_buf = io.BytesIO(wav_bytes)
    with wave.open(in_buf, "rb") as w:
        frames = bytearray(w.readframes(w.getnframes()))

    bits = "".join(str(b & 1) for b in frames)
    msg = []
    for i in range(0, len(bits), 8):
        byte = bits[i : i + 8]
        if len(byte) < 8:
            break
        try:
            msg.append(chr(int(byte, 2)))
        except ValueError:
            break
        if "".join(msg).endswith(END_MARKER):
            return "".join(msg).rstrip(END_MARKER)

    raise ValueError("End marker not found. The audio does not appear to contain a hidden message.")


def encode_text(cover: str, message: str) -> str:
    """Encode a message into a cover text using zero-width characters."""

    def encode_text_to_bits(text: str) -> str:
        bits = ""
        for ch in text:
            val = ord(ch)
            if 32 <= val <= 64:
                prefix = "0011"
                val += 48
            else:
                prefix = "0110"
                val -= 48
            bits += prefix + format(val ^ 170, "08b")
        return bits

    binary_stream = encode_text_to_bits(message) + TEXT_STOP_BITS
    words = cover.split()

    out_words = []
    bit_index = 0
    for word in words:
        if bit_index + 12 <= len(binary_stream):
            zwc = ""
            for i in range(0, 12, 2):
                pair = binary_stream[bit_index + i : bit_index + i + 2]
                zwc += ZWC_MAP[pair]
            out_words.append(word + zwc)
            bit_index += 12
        else:
            out_words.append(word)

    return " ".join(out_words)


def decode_text(stego: str) -> str:
    extracted_bits = ""
    for word in stego.split():
        for ch in word:
            if ch in ZWC_REVERSE:
                extracted_bits += ZWC_REVERSE[ch]
        if extracted_bits.endswith(TEXT_STOP_BITS):
            extracted_bits = extracted_bits[: -len(TEXT_STOP_BITS)]
            break

    if not extracted_bits:
        raise ValueError("No hidden message found in the provided text.")

    final = []
    for i in range(0, len(extracted_bits), 12):
        block = extracted_bits[i : i + 12]
        if len(block) < 12:
            break
        prefix = block[:4]
        value = int(block[4:], 2) ^ 170
        if prefix == "0110":
            final.append(chr(value + 48))
        else:
            final.append(chr(value - 48))

    return "".join(final)
