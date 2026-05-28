# Libretix

Real-time market dashboard for US stocks, IDX stocks, and crypto with:
- live market snapshots
- chart-based historical views
- financial news and sentiment
- Prophet price prediction overlay
- personal watchlist
- one-shot email price alerts

Libretix is built as a monitoring and research product, not a brokerage or trading execution platform.

---

## Current Highlights

- Next.js 14 frontend deployed on Vercel
- FastAPI backend deployed on Hugging Face Spaces
- Supabase Auth + cloud watchlist
- Gemini-powered news sentiment analysis
- Prophet batch prediction pipeline via GitHub Actions
- Resend-based one-shot price alerts
- Dark/light mode

---

## Tech Stack

### Frontend
- Next.js 14 App Router
- Tailwind CSS
- Zustand
- TradingView Lightweight Charts

### Backend
- FastAPI
- Supabase PostgreSQL
- Upstash Redis
- Hugging Face Spaces (Docker)

### ML and Sentiment
- Prophet for batch forecasting
- Gemini API via Google AI Studio for sentiment analysis

### Automation
- GitHub Actions for scraping, predictions, alerts, cleanup, and backend deploy

---

## Active Features

- Dashboard for US, IDX, and crypto
- Stock detail page with:
  - candlestick chart
  - Prophet prediction overlay
  - watchlist toggle
  - price alerts
- News page with:
  - sentiment summary
  - search
  - filter by sentiment
  - filter by ticker
- Personal cloud watchlist
- One-shot email alerts
- Dark/light theme toggle

---

## Features Not Yet Active

- LSTM or other sequence-based prediction model
- Separate real-time ML inference service
- Forex product surface in frontend
- Macro / FRED dashboard

The backend still contains some prepared endpoints or planned environment keys for future expansion, but those parts are not currently a live user-facing feature.

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Supabase project
- Upstash Redis account

---

## 1. Clone repository

```bash
git clone https://github.com/USERNAME/Libretix
cd Libretix
```

---

## 2. Setup Supabase

Run the schema in:

```text
backend/db/schema.sql
```

If your database was created before the alert feature, make sure the `price_alerts` table is also added.

You will need:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 3. Backend local setup

```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

Local backend:

```text
http://localhost:8000
http://localhost:8000/docs
```

### Backend `.env`

```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
NEWS_API_KEY=
FRED_API_KEY=
EXCHANGE_RATE_API_KEY=
```

Notes:
- `FRED_API_KEY` and `EXCHANGE_RATE_API_KEY` are currently optional for future features
- they are documented because the project has planned expansion in those areas

---

## 4. Frontend local setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Note:
- local development should use plain `http://localhost:8000`
- production requests are normalized to `https://` for non-local hosts

---

## 5. Optional local workflow testing

### News scraper + sentiment

If you want to run the news pipeline locally:

```bash
pip install -r scraper/requirements-news.txt
python -m scraper.news
```

Environment needed:

```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
NEWS_API_KEY=
GEMINI_API_KEY=
```

### Prophet prediction batch

```bash
pip install -r ml_service/requirements-predict.txt
python -m ml_service.models.prophet_model
```

### Alert checker

```bash
pip install -r scraper/requirements.txt
python -m backend.jobs.alert_checker
```

Environment needed:

```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
RESEND_API_KEY=
ALERT_FROM_EMAIL=Libretix <onboarding@resend.dev>
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/stocks/latest` | Latest stock list |
| GET | `/stocks/{ticker}` | Stock detail |
| GET | `/stocks/{ticker}/history` | Historical OHLCV |
| GET | `/stocks/{ticker}/predict` | Stored Prophet predictions |
| GET | `/news/` | Latest news |
| GET | `/news/stats` | Sentiment summary |
| GET | `/watchlist/` | Current user watchlist |
| POST | `/watchlist/` | Add ticker to watchlist |
| DELETE | `/watchlist/{ticker}/` | Remove ticker from watchlist |
| GET | `/alerts/` | Active user alerts |
| POST | `/alerts/` | Create alert |
| DELETE | `/alerts/{alert_id}/` | Delete alert |
| GET | `/forex/rates` | Prepared backend route, not yet used in live frontend |

---

## GitHub Actions Workflows

- `scrape-stocks.yml`
- `scrape-news.yml`
- `ml-predict.yml`
- `price-alert.yml`
- `cleanup.yml`
- `deploy-backend-hf.yml`

### Secrets currently relevant

#### GitHub Actions
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `NEWS_API_KEY`
- `GEMINI_API_KEY`
- `RESEND_API_KEY`
- `ALERT_FROM_EMAIL`
- `HF_TOKEN`

#### Hugging Face Space runtime
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `UPSTASH_REDIS_URL`
- `UPSTASH_REDIS_TOKEN`

Optional future runtime keys:
- `EXCHANGE_RATE_API_KEY`
- `FRED_API_KEY`

---

## Supabase Tables

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

## Roadmap Status

- [x] Phase 1 - Foundation
- [x] Phase 2 - Frontend Basic
- [x] Phase 3 - News and Sentiment
- [ ] Phase 4 - Prophet is live, sequence-model expansion still open
- [x] Phase 5 - Auth, watchlist, alerts, responsive UI, dark/light mode

Detailed planning lives in:

```text
PLANNING.md
```

---

## Important Notes About AI Usage

Current reality of the project:
- Prophet work was implemented with Codex support
- Gemini is used for frontend consultation and for sentiment analysis through Google AI Studio
- Mistral/Cohere are not part of the current production prediction pipeline
- there is no active LSTM model yet

So if you are reading older notes that mention Mistral, Cohere, FinBERT, or a separate ML FastAPI service, treat them as early planning rather than the current production setup.

---

## Additional Documentation

- `PLANNING.md`
- `CLAUDE.md`
- `backend/db/schema.sql`
- `.github/workflows/`
