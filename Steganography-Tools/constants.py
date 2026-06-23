END_MARKER = "*^*^*"
XOR_KEY = 170
TEXT_STOP_BITS = "111111111111"

ZWC_MAP = {
    "00": "\u200C",
    "01": "\u202C",
    "10": "\u200E",
    "11": "\u202D",
}

ZWC_REVERSE = {v: k for k, v in ZWC_MAP.items()}

ENCODED_FILES_FOLDER = "EncodedFiles/"