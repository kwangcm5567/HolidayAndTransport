from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import create_tables
from app.routers import holidays, windows, search, destinations, dashboard

app = FastAPI(
    title="SG Holiday Travel Finder",
    description="Find cheap flights and hotels around Singapore public holidays",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    create_tables()


@app.get("/")
@app.head("/")
def root():
    return {"status": "ok"}


@app.get("/api/health")
def health():
    return {"status": "ok"}


app.include_router(holidays.router, prefix="/api/v1")
app.include_router(windows.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(destinations.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
