# 🏦 Libretix — Open Source Edition

Real-time stock market dashboard for US & Indonesian markets with financial news, sentiment analysis, and machine learning forecasting.

Built with a modern AI-assisted engineering workflow, fully open source, and automated using GitHub Actions.

---

## 🧠 AI-Assisted Development Workflow

Libretix is developed using a structured **Multi-AI Engineering Workflow** inspired by how modern software teams are beginning to integrate AI into real development pipelines.

Instead of relying on a single AI model for everything, this project experiments with role-based AI orchestration where each model is used according to its strengths.

### AI Roles in This Project

* **Claude — System Orchestrator & Architecture Reviewer**

  * High-level architecture planning
  * Cross-service integration review
  * Workflow orchestration
  * Engineering consistency checks
  * Debugging & system planning

* **Gemini & GPT Models — Development Assistants**

  * Frontend implementation support
  * Boilerplate generation
  * UI component scaffolding
  * Structured coding tasks
  * Refactoring assistance

* **Mistral / Cohere — Planned ML Forecasting Assistant**

  * Lightweight forecasting experimentation
  * CPU-friendly ML pipelines
  * Time-series prediction workflows
  * Financial forecasting research

This approach is intentionally designed to simulate modern AI-assisted software engineering practices where:

* architecture and orchestration remain controlled,
* implementation tasks are delegated efficiently,
* and human validation remains mandatory.

All generated code still goes through:

* manual review,
* local testing,
* debugging,
* and validation before integration.

---

## 🚀 Quick Start — Phase 1

### Prerequisites

* Python 3.11+
* Node.js 18+
* Free Supabase account
* Free Upstash account (Redis)

---

## Step 1 — Clone Repository

```bash
git clone https://github.com/USERNAME/Libretix
cd Libretix
```

---

## Step 2 — Setup Supabase Database

1. Open Supabase dashboard
2. Create a new project
3. Open **SQL Editor**
4. Run:

```bash
backend/db/schema.sql
```

5. Save these credentials:

* `SUPABASE_URL`
* `SUPABASE_SERVICE_KEY`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 3 — Setup Backend

```bash
cd backend

cp .env.example .env
```

Fill `.env`:

```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
NEWS_API_KEY=
EXCHANGE_RATE_API_KEY=
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run backend:

```bash
uvicorn backend.main:app --reload --port 8000
```

API:

```bash
http://localhost:8000
```

Swagger Docs:

```bash
http://localhost:8000/docs
```

---

## Step 4 — Test Stock Scraper

```bash
python -m scraper.stocks
```

Verify data inside Supabase table:

```bash
stock_prices
```

---

## Step 5 — Setup GitHub Actions

Inside your GitHub repository:

`Settings → Secrets and variables → Actions`

Add these secrets:

| Secret Name             | Description           |
| ----------------------- | --------------------- |
| `SUPABASE_URL`          | Supabase project URL  |
| `SUPABASE_SERVICE_KEY`  | Supabase service key  |
| `NEWS_API_KEY`          | NewsAPI key           |
| `EXCHANGE_RATE_API_KEY` | Exchange rate API key |
| `UPSTASH_REDIS_URL`     | Redis URL             |
| `UPSTASH_REDIS_TOKEN`   | Redis token           |

GitHub Actions will automatically:

* scrape stock data hourly,
* collect financial news,
* run ML prediction jobs,
* and maintain automated workflows.

---

## Step 6 — Setup Frontend (Phase 2)

```bash
cd frontend

cp .env.example .env.local
```

Fill:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Install dependencies:

```bash
npm install
```

Run frontend:

```bash
npm run dev
```

Frontend:

```bash
http://localhost:3000
```

---

# 📡 API Endpoints

| Method | Endpoint                              | Description              |
| ------ | ------------------------------------- | ------------------------ |
| GET    | `/`                                   | Health check             |
| GET    | `/stocks/latest`                      | Latest stock prices      |
| GET    | `/stocks/latest?market=US`            | Filter US / IDX / CRYPTO |
| GET    | `/stocks/{ticker}`                    | Single stock detail      |
| GET    | `/stocks/{ticker}/history?period=1mo` | Historical stock data    |
| GET    | `/stocks/{ticker}/predict`            | ML prediction            |
| GET    | `/news/`                              | Latest financial news    |
| GET    | `/news/?ticker=BBCA.JK`               | News by ticker           |
| GET    | `/forex/rates`                        | Exchange rate data       |
| GET    | `/watchlist/`                         | Current user watchlist   |
| POST   | `/watchlist/`                         | Add ticker to watchlist  |
| DELETE | `/watchlist/{ticker}/`                | Remove ticker from watchlist |
| GET    | `/alerts/`                            | Active user price alerts |
| POST   | `/alerts/`                            | Create price alert       |
| DELETE | `/alerts/{alert_id}/`                 | Delete price alert       |

---

# 🏗 Project Structure

```bash
Libretix/
├── frontend/           → Next.js 14 frontend
├── backend/
│   ├── main.py         → FastAPI application
│   ├── routers/        → API routes
│   ├── models/         → Pydantic schemas
│   ├── db/             → Database schema & client
│   └── requirements.txt
├── ml-service/
│   ├── models/         → Forecasting models
│   └── requirements.txt
├── scraper/
│   ├── stocks.py       → yfinance + CoinGecko
│   └── news.py         → RSS feeds & NewsAPI
└── .github/workflows/  → GitHub Actions automation
```

---

# 📊 Planned ML Features

* Prophet forecasting
* TensorFlow Lite inference
* Confidence interval prediction
* Lightweight CPU deployment
* Financial sentiment analysis
* Missing-data handling
* Trend forecasting

---

# 🛡 Engineering & Validation Principles

This project emphasizes:

* maintainable architecture,
* scalable workflows,
* reproducible development,
* and cost-efficient AI orchestration.

AI assistance is treated as a development accelerator — not a replacement for software engineering fundamentals.

The goal of Libretix is not only to build a stock dashboard, but also to explore how modern AI-assisted workflows can be integrated into real engineering processes responsibly and efficiently.

---

# 🎨 Current Product Highlights

* Dark/light mode toggle in the top navigation
* Personal watchlist synced with Supabase Auth
* One-shot price alerts via Resend email delivery
* Prophet prediction overlay rendered directly on the stock chart

---

# 🗺 Roadmap

* [x] **Phase 1** — Backend API + Scraper + GitHub Actions
* [x] **Phase 2** — Next.js Frontend Dashboard
* [x] **Phase 3** — News & Sentiment Analysis
* [ ] **Phase 4** — ML Prediction with Prophet + advanced sequence models
  Prophet batch prediction and chart overlay are already live; sequence-model expansion remains open.
* [x] **Phase 5** — Auth, Watchlist, Price Alerts, Responsive UI, Theme Toggle

---

# 💰 Infrastructure Cost

Designed to run entirely on free-tier services:

* Supabase
* Vercel
* GitHub Actions
* Hugging Face Spaces
* Upstash Redis

Estimated infrastructure cost:

```bash
$0/month
```

---

# 📄 Additional Documentation

| File                    | Description                             |
| ----------------------- | --------------------------------------- |
| `CLAUDE.md`             | AI orchestration & engineering workflow |
| `PLANNING.md`           | Project planning & roadmap              |
| `backend/db/schema.sql` | Database schema                         |
| `.github/workflows/`    | Automation workflows                    |

---

# ⭐ Vision

Libretix is an experiment in combining:

* financial technology,
* machine learning,
* open-source engineering,
* and modern AI-assisted development workflows.

This project explores how AI orchestration can improve software engineering productivity while still maintaining architectural quality, human oversight, and scalable development practices.
