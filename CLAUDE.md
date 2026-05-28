# CLAUDE.md - Libretix Orchestration Guide

## Role

Claude acts as the project orchestrator:
- keeps architecture aligned
- reviews integration decisions
- helps backend and workflow consistency
- updates planning when implementation changes direction

Always cross-check implementation against:

```text
PLANNING.md
README.md
```

---

## Current Project Reality

This section matters because the early plan changed:

- frontend is implemented in Next.js 14
- backend is FastAPI and deployed to Hugging Face Spaces
- prediction is currently Prophet only
- prediction runs as a batch job via GitHub Actions
- there is no separate real-time ML service yet
- there is no active LSTM implementation yet
- sentiment analysis uses Gemini API via Google AI Studio
- Resend is used for email alerts
- forex and FRED are not active end-user features yet

Do not assume older planning notes are still accurate without checking the repo.

---

## Project Structure

```text
Libretix/
├── frontend/                 # Next.js frontend
├── backend/                  # FastAPI backend
│   ├── routers/
│   ├── jobs/
│   ├── db/
│   └── requirements.txt
├── ml_service/               # Prophet + sentiment modules
│   ├── models/
│   └── sentiment/
├── scraper/                  # Scheduled ingestion scripts
├── shared/                   # Shared config such as ticker universe
└── .github/workflows/        # GitHub Actions
```

---

## Division Ownership

### Division 1 - Frontend
**Primary usage today:** Gemini for consultation/support, Codex for implementation help

**Stack**
- Next.js 14 App Router
- Tailwind CSS
- lightweight custom UI primitives
- TradingView Lightweight Charts
- Zustand

**Typical file ownership**
- `frontend/app/**/*.tsx`
- `frontend/components/**/*.tsx`
- `frontend/lib/**/*.ts`

**Prompt style**
```text
You are a senior frontend developer expert in Next.js 14 App Router.
Project: Libretix.
Style: professional market dashboard, clean, minimal, responsive.

Rules:
- Use TypeScript strict
- Preserve mobile responsiveness
- Keep loading and error states explicit
- Use TradingView Lightweight Charts for market charts
- Avoid hardcoded API URLs
```

---

### Division 2 - Backend and Scraper
**Primary usage today:** Claude / Codex

**Stack**
- FastAPI
- Supabase
- Upstash Redis
- yfinance
- feedparser
- requests

**Responsibilities**
- REST API endpoints
- scraping jobs
- Supabase integration
- auth-aware backend routes
- GitHub Actions workflows

**Typical file ownership**
- `backend/**/*.py`
- `scraper/**/*.py`
- `.github/workflows/**/*.yml`
- `backend/requirements.txt`

---

### Division 3 - ML and Prediction
**Current implementation reality:** Prophet batch prediction implemented with Codex support

**Active stack**
- Python
- Prophet
- CmdStan / cmdstanpy
- Supabase

**Not active yet**
- LSTM
- TensorFlow Lite inference
- standalone ML FastAPI service

**Current responsibilities**
- train Prophet in batch
- store predictions in Supabase
- keep prediction output consistent for backend/frontend consumption

**Typical file ownership**
- `ml_service/models/**/*.py`
- `ml_service/requirements-predict.txt`

**Prompt style**
```text
You are an ML engineer focused on lightweight time-series forecasting.
Project: Libretix.
Current model: Prophet batch forecasting.

Rules:
- Keep CPU-friendly execution
- Store results in a predictable schema
- Include confidence intervals
- Handle missing and insufficient data safely
```

---

### Division 4 - News and Sentiment
**Current implementation reality:** Gemini API via Google AI Studio, not FinBERT

**Stack**
- RSS feeds
- NewsAPI
- `google-genai`
- Pydantic structured output

**Typical file ownership**
- `scraper/news.py`
- `ml_service/sentiment/analyzer.py`

**Prompt style**
```text
You are a financial news analyst.
Analyze the article and return structured JSON only.

Required fields:
- sentiment
- score
- tickers_affected
- summary_id
- summary_en
- impact
- category
```

The actual production implementation uses Gemini structured outputs and a local fallback ticker detector.

---

## Integration Flow

### Market data
```text
GitHub Actions hourly
  -> scraper/stocks.py
  -> Supabase stock_prices
  -> backend/routers/stocks.py
  -> frontend dashboard and stock detail pages
```

### News and sentiment
```text
GitHub Actions every 3 hours
  -> scraper/news.py
  -> ml_service/sentiment/analyzer.py
  -> Supabase news
  -> backend/routers/news.py
  -> frontend news page
```

### Predictions
```text
GitHub Actions daily
  -> ml_service/models/prophet_model.py
  -> Supabase predictions
  -> backend/routers/stocks.py (/predict)
  -> frontend chart overlay + prediction panel
```

### Price alerts
```text
Frontend stock detail page
  -> backend/routers/alerts.py
  -> Supabase price_alerts
  -> hourly GitHub Actions checker
  -> backend/jobs/alert_checker.py
  -> Resend email delivery
```

---

## Supabase Tables That Matter

### `stock_prices`
market history and latest price source

### `news`
news articles, summaries, sentiment, tickers affected

### `predictions`
Prophet batch output

### `watchlists`
cloud watchlist per authenticated user

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
```

Alerts are one-shot in the current UX:
- when triggered, they stop showing as active
- they remain stored as history in Supabase

---

## Environment Variables

### Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Backend runtime
```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
NEWS_API_KEY=
FRED_API_KEY=
EXCHANGE_RATE_API_KEY=
```

### Local alert checker
```env
RESEND_API_KEY=
ALERT_FROM_EMAIL=Libretix <onboarding@resend.dev>
```

### Local news sentiment testing
```env
GEMINI_API_KEY=
```

### GitHub Actions secrets currently relevant
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `NEWS_API_KEY`
- `GEMINI_API_KEY`
- `RESEND_API_KEY`
- `ALERT_FROM_EMAIL`
- `HF_TOKEN`

### Hugging Face Space runtime secrets
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `UPSTASH_REDIS_URL`
- `UPSTASH_REDIS_TOKEN`

---

## Code Review Checklist

### Frontend
- TypeScript strict
- loading and error states present
- mobile responsive
- theme-safe in dark and light mode
- no hardcoded production API URLs

### Backend
- response models where appropriate
- auth-sensitive routes do not trust client-sent user id
- errors surfaced cleanly
- no hardcoded credentials
- rate limiting preserved for public endpoints

### Prediction
- CPU friendly
- confidence interval included
- safe handling for insufficient data
- output compatible with stored `predictions` schema

### Workflows
- required secrets documented
- failure path visible in logs
- caches used where useful
- schedule is reasonable for free-tier limits

---

## Debugging Notes

### If stock data stops updating
1. check `scrape-stocks.yml`
2. verify Supabase write success
3. inspect `stock_prices`

### If news sentiment is missing
1. check `scrape-news.yml`
2. verify `GEMINI_API_KEY`
3. confirm analyzer import succeeded

### If predictions do not appear
1. check `ml-predict.yml`
2. inspect `predictions`
3. verify frontend `/stocks/{ticker}/predict` handling

### If alerts are not sent
1. check `price-alert.yml`
2. verify `RESEND_API_KEY`
3. verify `ALERT_FROM_EMAIL`
4. inspect `price_alerts.is_triggered`

### If local frontend hits HTTPS errors
1. confirm `NEXT_PUBLIC_API_URL=http://localhost:8000`
2. remember non-local hosts are normalized to HTTPS
3. if local requests show 307 redirects, check trailing-slash behavior before blaming CORS

---

## General Rules

1. Use environment variables for all secrets
2. Keep docs aligned with implementation reality
3. Do not mark planned ML components as live unless they are actually running
4. Treat forex and macro as planned unless the frontend product ships them
5. When architecture changes, update `PLANNING.md` and `README.md`
