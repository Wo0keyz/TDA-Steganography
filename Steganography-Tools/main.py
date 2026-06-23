#!/home/kali/missions/steganography/Steganography-Tools/.env/bin/python3
from image_steg import menu as image_menu
from audio_steg import menu as audio_menu
from text_steg import menu as text_menu
from utils import read_int

def main():
    while True:
        print("\nSTEGO MAIN MENU")
        print("1. Image")
        print("2. Text")
        print("3. Audio")
        print("4. Exit")

        choice = read_int("Enter choice: ", 1, 4)

        if choice == 1:
            image_menu()
        elif choice == 2:
            text_menu()
        elif choice == 3:
            audio_menu()
        else:
            break

if __name__ == "__main__":
    main()
