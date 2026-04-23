from pydantic import BaseModel
from typing import Optional


class SegmentOut(BaseModel):
    id: int
    seg_id: str
    source_text: str
    target_text: str
    status: str  # new | draft | confirmed
    source_lang: str
    target_lang: str

    model_config = {"from_attributes": True}


class SegmentUpdate(BaseModel):
    target_text: str
    status: str


class TMMatch(BaseModel):
    source_text: str
    target_text: str
    score: int  # 0-100, or 101 for ICE match


class TMEntryOut(BaseModel):
    id: int
    source_text: str
    target_text: str
    source_lang: str
    target_lang: str

    model_config = {"from_attributes": True}


class FileInfo(BaseModel):
    file_id: str
    source_lang: str
    target_lang: str
    total: int
    confirmed: int
    draft: int
    new: int
