from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import uuid

from database import get_db, SegmentRecord, TMEntry
from models import SegmentOut, SegmentUpdate, FileInfo
from xliff_parser import parse_xliff, generate_file_id, build_xliff

router = APIRouter(prefix="/api/files", tags=["segments"])


@router.post("/upload", response_model=FileInfo)
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    parsed = parse_xliff(content)
    file_id = generate_file_id(content)

    # Remove existing segments for this file_id to allow re-upload
    db.query(SegmentRecord).filter(SegmentRecord.file_id == file_id).delete()

    for seg in parsed["segments"]:
        record = SegmentRecord(
            file_id=file_id,
            seg_id=seg["seg_id"],
            source_text=seg["source_text"],
            target_text=seg["target_text"],
            status=seg["status"],
            source_lang=parsed["source_lang"],
            target_lang=parsed["target_lang"],
        )
        db.add(record)
    db.commit()

    return _file_info(db, file_id, parsed["source_lang"], parsed["target_lang"])


@router.get("/{file_id}/segments", response_model=List[SegmentOut])
def list_segments(file_id: str, db: Session = Depends(get_db)):
    segs = (
        db.query(SegmentRecord)
        .filter(SegmentRecord.file_id == file_id)
        .order_by(SegmentRecord.id)
        .all()
    )
    if not segs:
        raise HTTPException(404, "File not found")
    return segs


@router.patch("/{file_id}/segments/{seg_id}", response_model=SegmentOut)
def update_segment(
    file_id: str, seg_id: str, body: SegmentUpdate, db: Session = Depends(get_db)
):
    seg = (
        db.query(SegmentRecord)
        .filter(SegmentRecord.file_id == file_id, SegmentRecord.seg_id == seg_id)
        .first()
    )
    if not seg:
        raise HTTPException(404, "Segment not found")

    seg.target_text = body.target_text
    seg.status = body.status
    db.commit()
    db.refresh(seg)

    # Add to TM when confirmed
    if body.status == "confirmed" and body.target_text.strip():
        existing = (
            db.query(TMEntry)
            .filter(
                TMEntry.source_lang == seg.source_lang,
                TMEntry.target_lang == seg.target_lang,
                TMEntry.source_text == seg.source_text,
            )
            .first()
        )
        if existing:
            existing.target_text = body.target_text
        else:
            db.add(
                TMEntry(
                    source_lang=seg.source_lang,
                    target_lang=seg.target_lang,
                    source_text=seg.source_text,
                    target_text=body.target_text,
                )
            )
        db.commit()

    return seg


@router.get("/{file_id}/export")
def export_file(file_id: str, db: Session = Depends(get_db)):
    segs = (
        db.query(SegmentRecord)
        .filter(SegmentRecord.file_id == file_id)
        .order_by(SegmentRecord.id)
        .all()
    )
    if not segs:
        raise HTTPException(404, "File not found")

    seg_dicts = [
        {
            "seg_id": s.seg_id,
            "source_text": s.source_text,
            "target_text": s.target_text,
            "status": s.status,
        }
        for s in segs
    ]
    xliff_bytes = build_xliff(segs[0].source_lang, segs[0].target_lang, seg_dicts)
    return Response(
        content=xliff_bytes,
        media_type="application/xliff+xml",
        headers={"Content-Disposition": f'attachment; filename="{file_id}.xliff"'},
    )


@router.get("/{file_id}/info", response_model=FileInfo)
def file_info(file_id: str, db: Session = Depends(get_db)):
    first = db.query(SegmentRecord).filter(SegmentRecord.file_id == file_id).first()
    if not first:
        raise HTTPException(404, "File not found")
    return _file_info(db, file_id, first.source_lang, first.target_lang)


def _file_info(db: Session, file_id: str, source_lang: str, target_lang: str) -> FileInfo:
    rows = db.query(SegmentRecord).filter(SegmentRecord.file_id == file_id).all()
    counts = {"new": 0, "draft": 0, "confirmed": 0}
    for r in rows:
        counts[r.status] = counts.get(r.status, 0) + 1
    return FileInfo(
        file_id=file_id,
        source_lang=source_lang,
        target_lang=target_lang,
        total=len(rows),
        confirmed=counts["confirmed"],
        draft=counts["draft"],
        new=counts["new"],
    )
