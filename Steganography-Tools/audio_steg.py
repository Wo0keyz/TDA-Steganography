import wave
from constants import END_MARKER, ENCODED_FILES_FOLDER
from utils import read_non_empty_string

def encode_audio():
    name = "Sample_cover_files/cover_audio.wav"
    song = wave.open(name, 'rb')

    frames = bytearray(song.readframes(song.getnframes()))
    data = read_non_empty_string("Enter message: ") + END_MARKER
    bits = ''.join(format(ord(c), '08b') for c in data)

    for i, bit in enumerate(bits):
        frames[i] = (frames[i] & 254) | int(bit)

    out = ENCODED_FILES_FOLDER + read_non_empty_string("Enter output audio file: ")
    with wave.open(out, 'wb') as fd:
        fd.setparams(song.getparams())
        fd.writeframes(frames)

    song.close()
    print("✅ Audio encoded")

def decode_audio():
    name = ENCODED_FILES_FOLDER + read_non_empty_string("Enter audio file: ")
    song = wave.open(name, 'rb')

    frames = bytearray(song.readframes(song.getnframes()))
    bits = "".join(str(b & 1) for b in frames)

    msg = ""
    for i in range(0, len(bits), 8):
        msg += chr(int(bits[i:i+8], 2))
        if msg.endswith(END_MARKER):
            print("🔓 Decoded message:", msg[:-5])
            break

    song.close()


def menu():
    while True:
        print("\nAUDIO STEGANOGRAPHY")
        print("1. Encode")
        print("2. Decode")
        print("3. Exit")

        choice = input("Enter choice: ")

        if choice == "1":
            encode_audio()
        elif choice == "2":
            decode_audio()
        elif choice == "3":
            break
        else:
            print("❌ Invalid choice")