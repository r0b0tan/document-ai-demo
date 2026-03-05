"""
Pydantic schemas for request/response models.
"""

from typing import Any, Optional
from pydantic import BaseModel


class AnalyzeResponse(BaseModel):
    filename: str
    document_type: str
    data: dict[str, Any]
    text_preview: str
    confidence: Optional[float] = None
