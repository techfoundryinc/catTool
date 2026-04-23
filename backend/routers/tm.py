from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from rapidfuzz import fuzz

from database import get_db, TMEntry
from models import TMMatch, TMEntryOut

router = APIRouter(prefix="/api/tm", tags=["tm"])

MIN_SCORE = 50


@router.get("/lookup", response_model=List[TMMatch])
def lookup_tm(
    source_text: str = Query(...),
    source_lang: str = Query(...),
    target_lang: str = Query(...),
    db: Session = Depends(get_db),
):
    candidates = (
        db.query(TMEntry)
        .filter(TMEntry.source_lang == source_lang, TMEntry.target_lang == target_lang)
        .all()
    )

    results = []
    for entry in candidates:
        score = fuzz.token_sort_ratio(source_text, entry.source_text)
        if score >= MIN_SCORE:
            results.append(
                TMMatch(
                    source_text=entry.source_text,
                    target_text=entry.target_text,
                    score=score,
                )
            )

    results.sort(key=lambda x: x.score, reverse=True)
    return results[:5]


@router.get("/entries", response_model=List[TMEntryOut])
def list_tm(
    source_lang: str = Query(None),
    target_lang: str = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(TMEntry)
    if source_lang:
        q = q.filter(TMEntry.source_lang == source_lang)
    if target_lang:
        q = q.filter(TMEntry.target_lang == target_lang)
    return q.order_by(TMEntry.id.desc()).limit(100).all()
