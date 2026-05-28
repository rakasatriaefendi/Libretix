from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from backend.models.schemas import HealthResponse
from backend.routers.forex import router as forex_router
from backend.routers.news import router as news_router
from backend.routers.stocks import router as stocks_router
from backend.routers.watchlist import router as watchlist_router

limiter = Limiter(key_func=get_remote_address)


class ForceHTTPSRedirect(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if response.status_code in (301, 302, 307, 308):
            location = response.headers.get("location", "")
            if location.startswith("http://"):
                response.headers["location"] = f"https://{location[7:]}"
        return response

app = FastAPI(
    title="Libretix OSS — Backend API",
    description="REST API untuk data saham, berita, forex, dan prediksi ML.",
    version="0.1.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(ForceHTTPSRedirect)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ganti dengan domain Vercel di production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stocks_router)
app.include_router(news_router)
app.include_router(forex_router)
app.include_router(watchlist_router)


@app.get("/", response_model=HealthResponse)
async def root():
    return {"status": "ok", "version": "0.1.0"}


@app.get("/health", response_model=HealthResponse)
async def health():
    return {"status": "ok", "version": "0.1.0"}
#trigger2tes
