from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from datetime import datetime, timezone

DATABASE_URL = "sqlite:///./cat_tool.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class TMEntry(Base):
    __tablename__ = "tm_entries"

    id = Column(Integer, primary_key=True, index=True)
    source_lang = Column(String(10), nullable=False)
    target_lang = Column(String(10), nullable=False)
    source_text = Column(Text, nullable=False)
    target_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class SegmentRecord(Base):
    __tablename__ = "segments"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(String(64), nullable=False, index=True)
    seg_id = Column(String(64), nullable=False)
    source_text = Column(Text, nullable=False)
    target_text = Column(Text, nullable=False, default="")
    status = Column(String(20), nullable=False, default="new")
    source_lang = Column(String(10), nullable=False)
    target_lang = Column(String(10), nullable=False)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
