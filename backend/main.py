from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from backend.routers import stocks, news, forex
from backend.models.schemas import HealthResponse

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Libretix OSS — Backend API",
    description="REST API untuk data saham, berita, forex, dan prediksi ML.",
    version="0.1.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ganti dengan domain Vercel di production
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(stocks.router)
app.include_router(news.router)
app.include_router(forex.router)


@app.get("/", response_model=HealthResponse)
async def root():
    return {"status": "ok", "version": "0.1.0"}


@app.get("/health", response_model=HealthResponse)
async def health():
    return {"status": "ok", "version": "0.1.0"}
