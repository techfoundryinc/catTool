from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, text
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
    prev_source = Column(Text, nullable=True)
    next_source = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class SegmentRecord(Base):
    __tablename__ = "segments"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(String(64), nullable=False, index=True)
    seg_id = Column(String(64), nullable=False)
    source_text = Column(Text, nullable=False)
    target_text = Column(Text, nullable=False, default="")
    status = Column(String(20), nullable=False, default="new")
    tm_score = Column(Integer, nullable=True)
    source_lang = Column(String(10), nullable=False)
    target_lang = Column(String(10), nullable=False)


def init_db():
    Base.metadata.create_all(bind=engine)
    # Migrate: add context columns to existing tm_entries tables
    with engine.connect() as conn:
        for col in ("prev_source TEXT", "next_source TEXT", "tm_score INTEGER"):
            try:
                conn.execute(text(f"ALTER TABLE tm_entries ADD COLUMN {col}"))
                conn.commit()
            except Exception:
                pass
        try:
            conn.execute(text("ALTER TABLE segments ADD COLUMN tm_score INTEGER"))
            conn.commit()
        except Exception:
            pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
