

# Definition

*Don't take this into too much detail, otherwise you'll lose the interest of many people pretty fast.*

Steganography is the practice of hiding a secret message inside an ordinary, harmless-looking file or object so that no one else even suspects it exists.

Unlike cryptography (which scrambles a message into a secret code that looks suspicious), steganography hides the fact that a message is being sent in the first place.


**The 3 Core Elements:**

**The Cover:** The innocent-looking thing used to hide the secret (like a photo of a dog or a normal letter).
**The Secret:** The actual message, file, or image you want to hide.
**The Stego-Object:** The final product (the dog photo with the secret message hidden invisibly inside it)

**Other "things" that can be told in the presentation:**

For steganography to work, the "cover" item must look completely ordinary. If an image looks glitchy, or a letter looks suspicious, the cover is blown. The goal is not to lock the door (like a password does), but to hide the door entirely.

**The Weakness of Digital Steganography:**
The biggest enemy of digital steganography is compression. When you upload an image or video to platforms like WhatsApp, Discord, or Instagram, their servers automatically shrink the file size to save space. They do this by throwing away "unnecessary" code—which is exactly where your secret message is hidden. If a file gets compressed, the secret data is usually destroyed or corrupted. Because of this, spies and cybercriminals must use uncompressed files or upload files as raw documents to keep their data intact.


# Where is/was it used?

*Use these Examples as you like, maybe not all of them but see that the vast different Types of Steganography types get delivered.*

#### 1. Corporate and Industrial Espionage

**Zheng Xiaoqing Case:** A former General Electric engineer hid thousands of confidential files detailing turbine technologies inside the binary code of a digital photo of a sunset. He then emailed the innocuous-looking image to himself, allowing him to steal intellectual property for foreign entities.

#### 2. Espionage and Intelligence

**Cold War Musical Notes:** In 1985, a saxophonist and suspected Soviet bloc spy smuggled classified secrets by encoding the data into musical notes. The notes were written on standard sheet music and passed through borders, appearing as a completely normal musical composition.

**The 2010 Russian "Ghost Stories" Spy Ring:** The FBI arrested 11 sleeper agents who used customized, non-commercial steganography software to embed text communications inside public-facing, ordinary digital photos uploaded to the internet. This allowed them to communicate with Moscow intelligence without arousing suspicion.

**Ancient Wax Tablets:** In 480 BC, as documented by Herodotus, a former Greek king named Demeratus wanted to warn Sparta that Persia was planning an invasion. To bypass Persian checkpoints, he scraped the wax off wooden tablets, carved the secret warning directly into the wood, and covered it with fresh wax so it appeared completely blank.

#### 3. Cyber Warfare and Ransomware

**Malware Delivery:** Hackers and cybercriminals regularly use steganography to sneak payloads onto corporate networks. By embedding malware commands or ransomware instructions inside seemingly harmless image files, attackers bypass traditional firewall filters and antivirus systems, which typically only scan for standard executable files.

**Covert Command & Control (C2):** Threat actors have hidden text or code in the pixels of memes and graphics posted on public forums (like cat enthusiast boards) to safely relay instructions to botnets without alerting platform moderators.

#### 4. Digital Watermarking and Copyright Protection

**Copyright Tracking:** Media companies and photographers use digital steganography to embed hidden copyright signatures, serial numbers, or authentication codes directly into the audio frequencies of songs or the color channels of images. This hidden "watermark" acts as a digital fingerprint to prove ownership and track unauthorized use or pirated content online.

**Printer Tracking Dots (Yellow Ink):** Almost all modern commercial color laser printers secretly embed microscopic patterns of yellow dots on every page they print. Invisible to the naked eye, these dots encode the exact serial number of the printer, as well as the date and time of the print, used by law enforcement to trace forged documents or leaked papers.

#### 5. Whistleblowing and Oppressive Regimes

**Censorship Evasion:** Activists and journalists operating in heavily censored regions rely on steganography to safely exfiltrate sensitive documents. By hiding text documents, reports, or software tools inside seemingly mundane multimedia files, they can bypass government internet monitors and upload their files to public platforms.

**Jeremiah Denton’s Morse Code Blinking:** During a televised North Vietnamese propaganda interview in 1966, captured US Navy pilot Jeremiah Denton feigned distress from the camera lights while intentionally blinking his eyes in Morse code. He successfully spelled out the word "T-O-R-T-U-R-E", confirming to US Naval Intelligence for the first time that American POWs were being mistreated.



# How does it work?

*This will explain the basic principle of the three use-cases that are are on this post.*

#### 1. Hiding inside Images:
The LSB Method Digital images are made of pixels, and each pixel is usually broken down into three colour channels: Red, Green, and Blue (RGB).

Each colour's brightness is represented by an 8-bit binary number ranging from 00000000 (completely dark) to 11111111 (fully bright).The Concept: The first numbers in the sequence (the left side) change the colour drastically. The very last digit—the Least Significant Bit (LSB)—only changes the colour by a microscopic fraction (1 part out of 256).

#### 2. Hiding inside Videos:
Video files are the holy grail for hiding data because they are massive. A single video file combines thousands of images (frames) with an audio track, meaning you can hide entire novels, zip folders, or applications inside them without altering the overall file size noticeably.

**Inter-frame Hiding:** A video does not just show a sequence of independent photos. To save file size, modern video formats (like MP4 or MKV) only record the changes between frames (e.g., if a person moves their arm, only the arm pixels update; the background stays the same).

**How it hides data:** Steganography algorithms can hide data inside the motion vectors—the mathematical instructions that tell the video player how pixels move across the screen from frame to frame. By shifting a motion instruction by a fraction of a pixel, huge amounts of data can be woven directly into the action of the video

#### 3. Hiding inside Audio Files:
Audio files consist of thousands of electrical "samples" per second that tell your speakers how hard to vibrate. We can hide data inside these vibrations using two primary methods:

**LSB Audio Coding:** Just like with images, an audio software engineer can alter the lowest bit of the digital sound amplitude values. Because the human ear is incredibly sensitive to audio distortion, this is usually done only in high-bitrate files (like WAV or FLAC) or hidden within loud, chaotic frequencies like background drums.

**Psychoacoustic Masking:** The human brain naturally drops certain sounds it deems "unimportant." For example, if a deafeningly loud sound plays at the exact same time as a very quiet sound, your brain completely deletes the quiet sound from your conscious perception. Steganography tools intentionally replace those "auditorily deleted" frequencies with streams of secret digital data.

#### 4. Hiding inside Text:
Text steganography uses invisible characters to embed secret messages directly into ordinary-looking text files.

**Zero-Width Characters Method:** Special Unicode characters exist that take up no visible space on the screen. These characters are completely invisible to the human eye but are recognized by computers.

- A cover text (the visible, innocent-looking document) is loaded.
- The secret message is encoded and converted into a stream of invisible characters.
- These invisible characters are inserted between the words of the cover text.
- When you read or copy the document, you see only the normal text.
- Only someone who knows the steganography method can extract the hidden message.
