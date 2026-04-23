"""XLIFF 1.2 parser and serializer."""
from lxml import etree
from typing import List, Dict
import hashlib

XLIFF_NS = "urn:oasis:names:tc:xliff:document:1.2"
NSMAP = {"xliff": XLIFF_NS}


def _ns(tag: str) -> str:
    return f"{{{XLIFF_NS}}}{tag}"


def parse_xliff(content: bytes) -> Dict:
    """Parse XLIFF bytes and return structured data."""
    root = etree.fromstring(content)

    file_el = root.find(_ns("file"))
    if file_el is None:
        raise ValueError("No <file> element found in XLIFF")

    source_lang = file_el.get("source-language", "en")
    target_lang = file_el.get("target-language", "")

    segments = []
    for unit in root.iter(_ns("trans-unit")):
        seg_id = unit.get("id", "")
        source_el = unit.find(_ns("source"))
        target_el = unit.find(_ns("target"))

        source_text = "".join(source_el.itertext()) if source_el is not None else ""
        target_text = "".join(target_el.itertext()) if target_el is not None else ""

        state = ""
        if target_el is not None:
            state = target_el.get("state", "")

        if state == "final":
            status = "confirmed"
        elif target_text:
            status = "draft"
        else:
            status = "new"

        segments.append(
            {
                "seg_id": seg_id,
                "source_text": source_text,
                "target_text": target_text,
                "status": status,
                "source_lang": source_lang,
                "target_lang": target_lang,
            }
        )

    return {
        "source_lang": source_lang,
        "target_lang": target_lang,
        "segments": segments,
    }


def generate_file_id(content: bytes) -> str:
    return hashlib.sha1(content).hexdigest()[:16]


def build_xliff(source_lang: str, target_lang: str, segments: List[Dict]) -> bytes:
    """Serialize segments back to XLIFF bytes."""
    root = etree.Element("xliff", version="1.2", nsmap={None: XLIFF_NS})
    file_el = etree.SubElement(
        root,
        _ns("file"),
        **{
            "original": "document.xliff",
            "datatype": "plaintext",
            "source-language": source_lang,
            "target-language": target_lang,
        },
    )
    body = etree.SubElement(file_el, _ns("body"))

    for seg in segments:
        unit = etree.SubElement(body, _ns("trans-unit"), id=seg["seg_id"])
        src = etree.SubElement(unit, _ns("source"))
        src.text = seg["source_text"]

        state = "final" if seg["status"] == "confirmed" else "translated"
        tgt = etree.SubElement(unit, _ns("target"), state=state)
        tgt.text = seg["target_text"]

    return etree.tostring(root, pretty_print=True, xml_declaration=True, encoding="utf-8")
