from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class StockPrice(BaseModel):
    id: Optional[str] = None
    ticker: str
    price: float
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    volume: Optional[int] = None
    market: str  # 'IDX' atau 'US'
    timestamp: Optional[datetime] = None


class StockHistory(BaseModel):
    ticker: str
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class StockResponse(BaseModel):
    ticker: str
    price: float
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    volume: Optional[int] = None
    change: Optional[float] = None
    change_pct: Optional[float] = None
    market: str
    timestamp: datetime


class NewsItem(BaseModel):
    id: Optional[str] = None
    title: str
    url: Optional[str] = None
    source: Optional[str] = None
    summary_id: Optional[str] = None
    summary_en: Optional[str] = None
    sentiment: Optional[str] = None
    sentiment_score: Optional[int] = None
    impact: Optional[str] = None
    tickers_affected: Optional[list[str]] = None
    published_at: Optional[datetime] = None


class Prediction(BaseModel):
    ticker: str
    predicted_price: float
    confidence_low: float
    confidence_high: float
    prediction_date: str
    model_used: str


class HealthResponse(BaseModel):
    status: str
    version: str
