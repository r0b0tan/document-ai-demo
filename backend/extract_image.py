"""
Image text extraction via OCR using pytesseract + Pillow.
"""

import io
from PIL import Image
import pytesseract


def extract_text_from_image(file_bytes: bytes) -> str:
    """
    Run Tesseract OCR on an image given its raw bytes.
    Returns extracted text or raises on failure.
    """
    image = Image.open(io.BytesIO(file_bytes))

    # Convert to RGB to ensure compatibility with Tesseract
    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")

    text = pytesseract.image_to_string(image, lang="eng")
    return text.strip()
