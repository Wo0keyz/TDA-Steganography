import numpy as np
from pathlib import Path

def read_int(prompt, min_val=None, max_val=None):
    while True:
        try:
            value = int(input(prompt))
            if min_val is not None and value < min_val:
                raise ValueError
            if max_val is not None and value > max_val:
                raise ValueError
            return value
        except ValueError:
            print("❌ Please enter a valid number.")

def read_non_empty_string(prompt):
    while True:
        value = input(prompt).strip()
        if value:
            return value
        print("❌ Input cannot be empty.")

def ensure_file_exists(path):
    if not Path(path).exists():
        raise FileNotFoundError(f"File not found: {path}")

def msg_to_binary(msg):
    if isinstance(msg, str):
        return ''.join(format(ord(c), "08b") for c in msg)
    elif isinstance(msg, (bytes, np.ndarray)):
        return [format(b, "08b") for b in msg]
    else:
        raise TypeError("Unsupported input type for binary conversion")
