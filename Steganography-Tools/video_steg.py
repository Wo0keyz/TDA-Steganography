import cv2
from constants import END_MARKER, ENCODED_FILES_FOLDER
from utils import msg_to_binary, read_int, read_non_empty_string


def encode_video():
    cap = cv2.VideoCapture("Sample_cover_files/cover_video.mp4")
    if not cap.isOpened():
        raise ValueError("❌ Cover video not found")

    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)

    frame_to_embed = read_int(
        "Enter frame number to embed data: ", min_val=1
    )

    message = read_non_empty_string("Enter data to hide: ")
    message += END_MARKER
    binary_data = msg_to_binary(message)

    out = cv2.VideoWriter(
        ENCODED_FILES_FOLDER+"stego_video.mp4",
        cv2.VideoWriter_fourcc(*"XVID"),
        fps,
        (frame_width, frame_height),
    )

    current_frame = 0
    data_index = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        current_frame += 1

        if current_frame == frame_to_embed:
            for row in frame:
                for pixel in row:
                    for c in range(3):
                        if data_index < len(binary_data):
                            pixel[c] = int(
                                format(pixel[c], "08b")[:-1] + binary_data[data_index],
                                2,
                            )
                            data_index += 1

        out.write(frame)

    cap.release()
    out.release()
    print("✅ Video encoded successfully as stego_video.mp4")


def decode_video():
    cap = cv2.VideoCapture(ENCODED_FILES_FOLDER+"stego_video.mp4")
    if not cap.isOpened():
        raise ValueError("❌ Stego video not found")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Total frames in stego video: {total_frames}")

    frame_to_decode = read_int(
        "Enter frame number to extract data from: ",
        min_val=1,
        max_val=total_frames,
    )

    current_frame = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        current_frame += 1

        if current_frame == frame_to_decode:
            _extract_from_frame(frame)
            break

    cap.release()


def _extract_from_frame(frame):
    bits = ""

    for row in frame:
        for pixel in row:
            for c in range(3):
                bits += format(pixel[c], "08b")[-1]

    message = ""
    for i in range(0, len(bits), 8):
        message += chr(int(bits[i:i + 8], 2))
        if message.endswith(END_MARKER):
            print("\n🔓 Decoded message from video:")
            print(message[:-len(END_MARKER)])
            return

    print("⚠️ No hidden message found in selected frame")
