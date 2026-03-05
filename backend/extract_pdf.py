"""
PDF text extraction using pdfminer.six.
"""

import io
from pdfminer.high_level import extract_text_to_fp
from pdfminer.layout import LAParams


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract plain text from a PDF file given its raw bytes.
    Returns extracted text or raises on failure.
    """
    output = io.StringIO()
    with io.BytesIO(file_bytes) as pdf_stream:
        extract_text_to_fp(
            pdf_stream,
            output,
            laparams=LAParams(),
            output_type="text",
            codec="utf-8",
        )
    text = output.getvalue()
    return text.strip()
