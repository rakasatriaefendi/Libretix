# Libretix - Planning and Current Status

## Overview

Libretix is a real-time market dashboard for:
- US stocks
- IDX stocks
- Crypto

Current product direction:
- market monitoring and research
- news and sentiment context
- batch-based price prediction
- personal watchlist
- one-shot email price alerts

Libretix is not a brokerage or trading execution platform.

---

## Current Architecture

### Frontend
- Next.js 14 App Router
- Tailwind CSS
- lightweight custom UI primitives inspired by shadcn/ui
- TradingView Lightweight Charts
- Zustand
- Deploy: Vercel

### Backend
- FastAPI
- Supabase PostgreSQL
- Upstash Redis
- Deploy: Hugging Face Spaces (Docker)

### Prediction
- Prophet only
- Executed as a batch job via GitHub Actions
- Output stored in Supabase `predictions`
- No separate real-time ML service yet
- No LSTM model yet

### News and Sentiment
- RSS feeds + NewsAPI
- Sentiment analysis via Gemini API from Google AI Studio
- Implemented in `ml_service/sentiment/analyzer.py`

### Alerts
- One-shot price alerts
- Email delivery via Resend
- Alert checker runs hourly via GitHub Actions

### Shared ticker universe
- `shared/tickers.py` is the source of truth for scraper and Prophet coverage

---

## Project Structure

```text
Libretix/
├── frontend/                    # Next.js frontend
├── backend/                     # FastAPI API + jobs
│   ├── routers/
│   ├── jobs/
│   ├── db/
│   └── requirements.txt
├── ml_service/                  # Prophet + sentiment analysis
│   ├── models/
│   └── sentiment/
├── scraper/                     # Hourly / scheduled data collectors
├── shared/                      # Shared config such as ticker universe
└── .github/workflows/           # GitHub Actions automation
```

---

## Active Data Sources

| Area | Source | Status |
|---|---|---|
| US stocks | Yahoo Finance via `yfinance` | Active |
| IDX stocks | Yahoo Finance via `yfinance` | Active |
| Crypto | CoinGecko | Active |
| News | RSS feeds | Active |
| News | NewsAPI | Active when key is available |
| Sentiment | Gemini API | Active |
| Forex | ExchangeRate API | Not active in product yet |
| Macro indicators | FRED API | Not active in product yet |

---

## GitHub Actions in Use

- `scrape-stocks.yml`
  - hourly stock and crypto ingest
- `scrape-news.yml`
  - every 3 hours
- `ml-predict.yml`
  - daily Prophet prediction batch
- `price-alert.yml`
  - hourly alert checker + Resend email delivery
- `cleanup.yml`
  - monthly cleanup
- `deploy-backend-hf.yml`
  - deploy backend package to Hugging Face Spaces

---

## Supabase Tables

### Core tables
- `stock_prices`
- `news`
- `predictions`
- `watchlists`
- `price_alerts`

### `price_alerts`

```sql
CREATE TABLE price_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,
    target_price NUMERIC NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('above', 'below')),
    is_triggered BOOLEAN DEFAULT FALSE,
    triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alerts"
ON price_alerts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_price_alerts_ticker ON price_alerts(ticker);
CREATE INDEX idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX idx_price_alerts_triggered ON price_alerts(is_triggered);
```

---

## Phase Status

### Phase 1 - Foundation
- [x] Setup repo and folder structure
- [x] US + IDX stock scraper using `yfinance`
- [x] GitHub Actions hourly scraping to Supabase
- [x] Basic API endpoints for latest price and history

### Phase 2 - Frontend Basic
- [x] Dashboard layout
- [x] Watchlist + stock search
- [x] Candlestick chart with TradingView Lightweight Charts
- [x] Deploy frontend to Vercel

### Phase 3 - News and Sentiment
- [x] News scraping via RSS + NewsAPI
- [x] Sentiment analysis per article
- [x] News page + ticker filtering
- [x] News-to-ticker mapping

### Phase 4 - ML Prediction
- [x] Prophet trend prediction
- [ ] Sequence-based model exploration such as LSTM
- [ ] Separate real-time inference service if later needed
- [x] Prediction overlay on chart

Notes:
- current implementation is batch-based
- prediction output is written to Supabase, then consumed by backend and frontend
- no Hugging Face ML inference service is required for the current architecture

### Phase 5 - Polish and Auth
- [x] Supabase Auth
- [x] Personal watchlist per user
- [x] Price alert via email using Resend
- [x] Mobile responsive polish
- [x] Dark/light mode

---

## Open Follow-ups

- evaluate whether LSTM is still worth building after Prophet coverage stabilizes
- decide if forex deserves a real product surface or should remain postponed
- decide if macro/FRED data should become a dedicated market context panel
- decide whether price alerts should remain one-shot only or later support digest / cooldown modes

---

## Reality Check vs Early Plan

These are important clarifications so the documentation matches the actual project:

- Prophet was implemented and operationalized with Codex support
- Gemini is currently used mainly for frontend consultation and sentiment analysis via Google AI Studio
- Mistral/Cohere are not part of the current production ML pipeline
- There is no active LSTM implementation yet
- There is no active forex feature in the frontend product yet
- Backend is deployed on Hugging Face Spaces, not Railway or Render
- Resend is now part of the live alert workflow
