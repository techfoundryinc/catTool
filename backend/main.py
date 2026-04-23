import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from database import init_db
from routers import segments, tm

app = FastAPI(title="CAT Tool API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(segments.router)
app.include_router(tm.router)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/api/health")
def health():
    return {"status": "ok"}


# Serve built frontend
DIST = os.path.join(os.path.dirname(__file__), "../frontend/dist")
if os.path.isdir(DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")

    @app.get("/")
    def index():
        return FileResponse(os.path.join(DIST, "index.html"))

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        return FileResponse(os.path.join(DIST, "index.html"))
