# CLAUDE.md — Super AI Orchestration Guide

## 🧠 Peran Claude dalam Project Ini

Kamu adalah **Super AI** yang mengawasi seluruh pengembangan project Libretix.
Tugasmu adalah memastikan semua divisi bekerja secara kohesif, kode terintegrasi dengan baik,
dan project berjalan sesuai planning.

---

## 📁 Struktur Project

Selalu refer ke `PLANNING.md` untuk gambaran besar project.

```
Libretix/
├── frontend/       → Next.js 14 (Gemini yang kerjakan)
├── backend/        → FastAPI (Claude yang kerjakan)
├── ml-service/     → FastAPI ML (Mistral/Cohere yang kerjakan)
├── scraper/        → Python scripts (Claude yang kerjakan)
└── .github/        → GitHub Actions workflows
```

---

## 👥 Divisi & Tanggung Jawab

### Divisi 1 — Frontend (Gemini)
**Stack:** Next.js 14, Tailwind CSS, shadcn/ui, TradingView Lightweight Charts, Zustand

**Prompt template untuk Gemini:**
```
Kamu adalah senior frontend developer expert Next.js 14 App Router.
Project: Libretix — dashboard saham real-time.
Style: dark theme mirip Libretix, professional, minimal.
Stack: Next.js 14, Tailwind CSS, shadcn/ui, TradingView Lightweight Charts.

Tugas: Buat [nama komponen/halaman].
Data yang diterima: [struktur data/props].
Endpoint API: [URL endpoint].

Rules:
- Gunakan TypeScript strict
- Semua komponen harus responsive
- Gunakan shadcn/ui untuk UI primitives
- Chart menggunakan TradingView Lightweight Charts
- Loading state wajib ada
- Error handling wajib ada
```

**File yang dikerjakan Gemini:**
- `frontend/app/**/*.tsx`
- `frontend/components/**/*.tsx`
- `frontend/styles/**`

---

### Divisi 2 — Backend & Scraper (Claude)
**Stack:** FastAPI, Supabase, Upstash Redis, yfinance, feedparser

**Responsibilities:**
- REST API endpoints
- Data scraping (saham, berita, forex)
- Database schema & migrations
- GitHub Actions workflows
- Caching layer

**File yang dikerjakan:**
- `backend/**/*.py`
- `scraper/**/*.py`
- `.github/workflows/**/*.yml`
- `backend/requirements.txt`

---

### Divisi 3 — ML & Prediksi (Mistral / Cohere)
**Stack:** Prophet, TensorFlow Lite, FastAPI, scikit-learn

**Prompt template untuk Mistral:**
```
Kamu adalah ML engineer expert time series forecasting dan financial analysis.
Project: Libretix.
Stack: Python, Prophet, TensorFlow Lite, FastAPI.

Tugas: [nama tugas ML].
Input data format: [format data].
Output yang diharapkan: [format output JSON].

Rules:
- Model harus ringan (bisa jalan di Hugging Face Spaces CPU)
- Output selalu dalam format JSON
- Sertakan confidence interval di setiap prediksi
- Handle missing data dengan baik
```

**File yang dikerjakan:**
- `ml-service/**/*.py`
- `ml-service/requirements.txt`

---

### Divisi 4 — News & Sentiment (Gemini / GPT-4o Mini)
**Stack:** feedparser, NewsAPI, transformers (FinBERT)

**Prompt template:**
```
Kamu adalah financial news analyst expert.
Analisis artikel berita berikut dan return JSON:

{
  "sentiment": "positive|negative|neutral",
  "score": 0-100,
  "tickers_affected": ["BBCA.JK", "AAPL"],
  "summary_id": "ringkasan 2 kalimat bahasa Indonesia",
  "summary_en": "2 sentence summary in English",
  "impact": "high|medium|low",
  "category": "earnings|merger|macro|sector|other"
}

Artikel: [isi artikel]
Hanya return JSON, tidak ada teks lain.
```

**File yang dikerjakan:**
- `scraper/news.py`
- `ml-service/sentiment/analyzer.py`

---

## 🔄 Workflow Integrasi

### Alur Data
```
GitHub Actions (tiap jam)
    → scraper/stocks.py (yfinance)
    → Supabase DB (tabel: stock_prices)
    → backend/routers/stocks.py (API)
    → frontend/components/Chart.tsx (tampilan)

GitHub Actions (tiap 3 jam)
    → scraper/news.py (NewsAPI + RSS)
    → ml-service/sentiment/analyzer.py (scoring)
    → Supabase DB (tabel: news)
    → backend/routers/news.py (API)
    → frontend/app/news/page.tsx (tampilan)

GitHub Actions (tiap hari jam 01.00 UTC)
    → ml-service/models/prophet_model.py (prediksi)
    → Supabase DB (tabel: predictions)
    → backend/routers/stocks.py (endpoint /predict)
    → frontend/components/PredictionBadge.tsx (tampilan)
```

### Database Schema (Supabase)
```sql
-- Harga saham
CREATE TABLE stock_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker VARCHAR(20) NOT NULL,
  price DECIMAL(12,4),
  open DECIMAL(12,4),
  high DECIMAL(12,4),
  low DECIMAL(12,4),
  volume BIGINT,
  market VARCHAR(10), -- 'IDX' atau 'US'
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Berita
CREATE TABLE news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT,
  source VARCHAR(100),
  summary_id TEXT,
  summary_en TEXT,
  sentiment VARCHAR(10),
  sentiment_score INT,
  impact VARCHAR(10),
  tickers_affected TEXT[], -- array of tickers
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prediksi ML
CREATE TABLE predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker VARCHAR(20) NOT NULL,
  predicted_price DECIMAL(12,4),
  confidence_low DECIMAL(12,4),
  confidence_high DECIMAL(12,4),
  prediction_date DATE,
  model_used VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watchlist user
CREATE TABLE watchlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  ticker VARCHAR(20) NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🚦 Code Review Checklist (Claude sebagai Super AI)

Setiap kali ada kode baru dari divisi lain, Claude harus cek:

### Frontend (dari Gemini)
- [ ] TypeScript strict, tidak ada `any`
- [ ] Loading state sudah ada
- [ ] Error handling sudah ada
- [ ] Responsive di mobile
- [ ] Tidak ada hardcoded API URL (pakai env variable)
- [ ] Komponen tidak terlalu besar (max 200 baris)

### Backend (self-review)
- [ ] Endpoint sudah ada response model (Pydantic)
- [ ] Error handling dengan HTTPException
- [ ] Data sudah di-cache dengan Redis kalau perlu
- [ ] Tidak ada credential hardcoded
- [ ] Ada rate limiting untuk endpoint publik

### ML Service (dari Mistral/Cohere)
- [ ] Model bisa jalan di CPU (tidak butuh GPU)
- [ ] Output selalu dalam format yang konsisten
- [ ] Handle kasus data kosong/null
- [ ] Prediksi ada confidence interval-nya
- [ ] Model size tidak lebih dari 100MB

### GitHub Actions Workflows
- [ ] Secrets tidak di-expose di log
- [ ] Ada error handling (continue-on-error atau try-catch)
- [ ] Jadwal cron tidak terlalu sering (hemat quota)
- [ ] Artifacts/cache digunakan kalau bisa

---

## 🐛 Debugging Guide

### Kalau data saham tidak update
1. Cek GitHub Actions log workflow `scrape-stocks.yml`
2. Cek apakah yfinance return data (bisa rate limit)
3. Cek koneksi ke Supabase (env variable benar?)
4. Cek tabel `stock_prices` di Supabase dashboard

### Kalau prediksi ML tidak muncul
1. Cek Hugging Face Spaces apakah running
2. Cek log workflow `ml-predict.yml`
3. Cek tabel `predictions` apakah ada data baru
4. Cek endpoint `/predict` di backend

### Kalau berita tidak muncul
1. Cek quota NewsAPI (100 req/hari)
2. Kalau habis, fallback ke RSS feed
3. Cek sentiment analyzer berjalan
4. Cek tabel `news` di Supabase

---

## 📝 Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_ML_URL=https://your-ml.hf.space
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (.env)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
UPSTASH_REDIS_URL=your-redis-url
UPSTASH_REDIS_TOKEN=your-redis-token
NEWS_API_KEY=your-newsapi-key
FRED_API_KEY=your-fred-key
EXCHANGE_RATE_API_KEY=your-key
```

### GitHub Actions Secrets
Tambahkan semua key di atas ke:
`Repo Settings → Secrets and variables → Actions`

---

## 🎯 Saham yang Ditrack (Default)

### Saham AS
```python
US_TICKERS = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "META",
    "NVDA", "TSLA", "JPM", "V", "WMT"
]
```

### Saham IDX
```python
IDX_TICKERS = [
    "BBCA.JK", "BBRI.JK", "TLKM.JK", "ASII.JK", "BMRI.JK",
    "GOTO.JK", "BYAN.JK", "UNVR.JK", "ICBP.JK", "EXCL.JK"
]
```

### Crypto
```python
CRYPTO_IDS = [
    "bitcoin", "ethereum", "binancecoin",
    "solana", "ripple"
]
```

User bisa tambah ticker sendiri lewat fitur watchlist.

---

## 📌 Aturan Umum untuk Semua Divisi

1. **Selalu gunakan environment variable** — tidak boleh hardcode API key
2. **Commit message harus jelas** — `feat:`, `fix:`, `chore:`, `docs:`
3. **Satu PR satu fitur** — tidak boleh campur banyak perubahan
4. **Test dulu di local** sebelum push
5. **Update PLANNING.md** kalau ada perubahan arsitektur
6. **Tanya Claude** kalau ada konflik antar service atau keputusan arsitektur besar
