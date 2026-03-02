from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import APP_NAME, CORS_ORIGINS
from .database import Base, SessionLocal, engine
from .routers import admin, auth, doctors, food_checks, meal_plans
from .seed import seed_doctors


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_doctors(db)
    finally:
        db.close()
    yield


app = FastAPI(title=APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(doctors.router)
app.include_router(food_checks.router)
app.include_router(meal_plans.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {
        "message": "Welcome to Medicine App API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
