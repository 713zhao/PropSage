import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

from app.routers import tax, profile, market, transactions, loans, roi, enbloc, advisor
from app.routers import map as map_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.database import init_db
    init_db()
    yield


app = FastAPI(title="PropSage API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": str(exc)})


app.include_router(tax.router)
app.include_router(profile.router)
app.include_router(market.router)
app.include_router(transactions.router)
app.include_router(loans.router)
app.include_router(roi.router)
app.include_router(enbloc.router)
app.include_router(map_router.router)
app.include_router(advisor.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
