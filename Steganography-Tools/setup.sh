#!/bin/bash

# Create virtual environment
python3 -m venv .env

# Activate virtual environment
source .env/bin/activate

# Install required packages
pip install numpy opencv-python

# Get full path to the Python interpreter in the virtual environment
INTERPRETER="$(which python3)"

# File to update
FILE="main.py"

# Check if first line is a shebang
if head -n 1 "$FILE" | grep -q "^#!"; then
    # Replace the first line
    sed -i "1s|.*|#!$INTERPRETER|" "$FILE"
else
    # Insert shebang at the top
    sed -i "1i #!$INTERPRETER" "$FILE"
fi
