import cv2
from constants import END_MARKER, ENCODED_FILES_FOLDER
from utils import msg_to_binary, read_non_empty_string

def encode_image():
    img = cv2.imread("Sample_cover_files/cover_image.jpg")
    if img is None:
        raise ValueError("Image not found")

    data = read_non_empty_string("Enter data to encode: ") + END_MARKER
    binary = msg_to_binary(data)
    idx = 0

    for row in img:
        for pixel in row:
            for c in range(3):
                if idx < len(binary):
                    pixel[c] = int(format(pixel[c], "08b")[:-1] + binary[idx], 2)
                    idx += 1

    out = ENCODED_FILES_FOLDER + read_non_empty_string("Enter output image name: ")
    cv2.imwrite(out, img)
    print("✅ Image encoded")

def decode_image():
    path = ENCODED_FILES_FOLDER + read_non_empty_string("Enter image name: ")
    img = cv2.imread(path)
    if img is None:
        raise ValueError("Image not found")

    bits = ""
    for row in img:
        for pixel in row:
            for c in range(3):
                bits += format(pixel[c], "08b")[-1]

    chars = [bits[i:i+8] for i in range(0, len(bits), 8)]
    message = ""
    for ch in chars:
        message += chr(int(ch, 2))
        if message.endswith(END_MARKER):
            print("🔓 Decoded message:", message[:-5])
            return


def menu():
    while True:
        print("\nIMAGE STEGANOGRAPHY")
        print("1. Encode")
        print("2. Decode")
        print("3. Exit")

        choice = input("Enter choice: ")

        if choice == "1":
            encode_image()
        elif choice == "2":
            decode_image()
        elif choice == "3":
            break
        else:
            print("❌ Invalid choice")