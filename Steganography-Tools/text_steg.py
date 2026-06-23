from constants import XOR_KEY, TEXT_STOP_BITS, ZWC_MAP, ZWC_REVERSE, ENCODED_FILES_FOLDER
from utils import read_non_empty_string, ensure_file_exists

def encode_text_to_bits(text):
    bits = ""
    for ch in text:
        val = ord(ch)
        if 32 <= val <= 64:
            prefix = "0011"
            val += 48
        else:
            prefix = "0110"
            val -= 48
        bits += prefix + format(val ^ XOR_KEY, "08b")
    return bits

def txt_encode():
    cover_path = "Sample_cover_files/cover_text.txt"
    ensure_file_exists(cover_path)

    message = read_non_empty_string("Enter message to encode: ")
    output_file = ENCODED_FILES_FOLDER + read_non_empty_string("Enter stego file name: ")

    binary_stream = encode_text_to_bits(message) + TEXT_STOP_BITS

    with open(cover_path, "r", encoding="utf-8") as cover, \
         open(output_file, "w", encoding="utf-8") as stego:

        words = cover.read().split()
        bit_index = 0

        for word in words:
            if bit_index + 12 <= len(binary_stream):
                zwc = ""
                for i in range(0, 12, 2):
                    pair = binary_stream[bit_index+i:bit_index+i+2]
                    zwc += ZWC_MAP[pair]
                stego.write(word + zwc + " ")
                bit_index += 12
            else:
                stego.write(word + " ")

    print("✅ Text encoded successfully.")

def txt_decode():
    stego = ENCODED_FILES_FOLDER + read_non_empty_string("Enter stego file name: ")
    ensure_file_exists(stego)

    extracted_bits = ""

    with open(stego, "r", encoding="utf-8") as f:
        for word in f.read().split():
            bits = "".join(ZWC_REVERSE[c] for c in word if c in ZWC_REVERSE)
            if bits == TEXT_STOP_BITS:
                break
            extracted_bits += bits

    final = ""
    for i in range(0, len(extracted_bits), 12):
        prefix = extracted_bits[i:i+4]
        value = int(extracted_bits[i+4:i+12], 2) ^ XOR_KEY
        if prefix == "0110":
            final += chr(value + 48)
        else:
            final += chr(value - 48)

    print("🔓 Decoded message:", final)

def menu():
    while True:
        print("\nTEXT STEGANOGRAPHY")
        print("1. Encode")
        print("2. Decode")
        print("3. Exit")

        choice = input("Enter choice: ")
        if choice == "1":
            txt_encode()
        elif choice == "2":
            txt_decode()
        elif choice == "3":
            break
        else:
            print("❌ Invalid choice")
