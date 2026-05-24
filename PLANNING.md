# 🏦 Libretix — Open Source Edition

## 🎯 Project Overview

Dashboard saham real-time dengan data AS & Indonesia, berita pasar, dan prediksi ML.
Fully free, open source, auto-update via GitHub Actions.

---

## 📊 Data Sources (Legal & Gratis)

| Data | Source | Library | Limit |
|------|--------|---------|-------|
| Saham AS (NYSE/NASDAQ) | Yahoo Finance | `yfinance` | Unlimited |
| Saham IDX | Yahoo Finance (suffix `.JK`) | `yfinance` | Unlimited |
| Crypto | CoinGecko API | `requests` | 30 req/min |
| Berita Saham AS | NewsAPI.org | `requests` | 100 req/hari (free) |
| Berita IDX | CNBC Indonesia RSS | `feedparser` | Unlimited |
| Berita Global | Reuters RSS | `feedparser` | Unlimited |
| Indikator Ekonomi | FRED API (Federal Reserve) | `fredapi` | Unlimited |
| Forex | ExchangeRate API | `requests` | 1500 req/bulan |

---

## 🏗️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI:** Tailwind CSS + shadcn/ui
- **Chart:** TradingView Lightweight Charts (gratis, profesional)
- **State:** Zustand
- **Deploy:** Vercel (free tier)

### Backend
- **Framework:** FastAPI (Python)
- **Database:** Supabase (PostgreSQL, free tier — 500MB)
- **Cache:** Upstash Redis (free tier — 10k req/hari)
- **Deploy:** Railway.app (free tier) atau Render.com (gratis)

### ML Service
- **Framework:** FastAPI terpisah
- **Model:** Prophet + LSTM (TensorFlow Lite)
- **Deploy:** Hugging Face Spaces (gratis, support Python)

### Automation
- **Scheduler:** GitHub Actions
- **Storage:** Supabase + GitHub repo (CSV backup)

---

## 🗂️ Struktur Project

```
Libretix/
├── frontend/                    # Next.js
│   ├── app/
│   │   ├── page.tsx             # Landing page
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Dashboard utama
│   │   ├── stock/
│   │   │   └── [ticker]/
│   │   │       └── page.tsx     # Detail per saham
│   │   └── news/
│   │       └── page.tsx         # Halaman berita
│   ├── components/
│   │   ├── Chart.tsx
│   │   ├── Watchlist.tsx
│   │   ├── NewsCard.tsx
│   │   └── PredictionBadge.tsx
│   └── package.json
│
├── backend/                     # FastAPI data service
│   ├── main.py
│   ├── routers/
│   │   ├── stocks.py
│   │   ├── news.py
│   │   └── forex.py
│   ├── models/
│   │   └── schemas.py
│   ├── db/
│   │   └── supabase.py
│   └── requirements.txt
│
├── ml-service/                  # FastAPI ML prediction
│   ├── main.py
│   ├── models/
│   │   ├── prophet_model.py
│   │   └── lstm_model.py
│   ├── sentiment/
│   │   └── analyzer.py
│   └── requirements.txt
│
├── scraper/                     # Python scripts
│   ├── stocks.py
│   ├── news.py
│   └── forex.py
│
├── data/                        # CSV backup
│   ├── stocks/
│   ├── news/
│   └── forex/
│
├── .github/
│   └── workflows/
│       ├── scrape-stocks.yml    # Tiap jam
│       ├── scrape-news.yml      # Tiap 3 jam
│       └── ml-predict.yml       # Tiap hari
│
├── PLANNING.md                  # File ini
├── CLAUDE.md                    # Panduan Super AI
└── README.md
```

---

## 👥 Divisi & AI yang Mengerjakan

```
Super AI — Claude (Pengawas)
├── Mengawasi semua divisi
├── Code review & integrasi
├── Arsitektur decision
└── Debugging cross-service

Divisi 1 — Frontend        → Gemini
Divisi 2 — Backend/Scraper → Claude / GitHub Copilot
Divisi 3 — ML & Prediksi   → Mistral / Cohere
Divisi 4 — News & Sentiment→ Gemini / GPT-4o Mini
```

---

## 🗓️ Timeline & Fase Pengerjaan

### Phase 1 — Foundation (Minggu 1-2)
- [ ] Setup repo & struktur folder
- [ ] Scraper saham AS + IDX (yfinance)
- [ ] GitHub Actions scrape tiap jam → simpan ke Supabase
- [ ] API endpoint basic (get stock data, get history)

### Phase 2 — Frontend Basic (Minggu 3-4)
- [ ] Dashboard layout
- [ ] Watchlist + search saham
- [ ] Chart candlestick (TradingView Lightweight Charts)
- [ ] Deploy frontend ke Vercel

### Phase 3 — News & Sentiment (Minggu 5-6)
- [ ] Scraper berita (NewsAPI + RSS)
- [ ] Sentiment analysis tiap artikel
- [ ] Halaman berita + filter per ticker
- [ ] Mapping berita → saham terpengaruh

### Phase 4 — ML Prediction (Minggu 7-8)
- [ ] Model Prophet untuk prediksi trend
- [ ] LSTM untuk pattern recognition
- [ ] Deploy ML service ke Hugging Face Spaces
- [ ] Tampilkan prediksi di chart

### Phase 5 — Polish & Auth (Minggu 9-10)
- [ ] Auth (Supabase Auth, gratis)
- [ ] Personal watchlist per user
- [ ] Price alert via email (Resend.com, gratis)
- [ ] Mobile responsive
- [ ] Dark/light mode

---

## 💰 Estimasi Biaya

| Service | Free Tier | Cukup? |
|---------|-----------|--------|
| Vercel | 100GB bandwidth/bulan | ✅ |
| Supabase | 500MB DB, 2GB transfer | ✅ |
| Railway | $5 credit/bulan | ✅ awal |
| Hugging Face Spaces | CPU basic gratis | ✅ |
| Upstash Redis | 10k req/hari | ✅ |
| NewsAPI | 100 req/hari | ✅ |
| Resend | 3000 email/bulan | ✅ |
| **Total** | **$0/bulan** | ✅ |

---

## 🔑 API Keys yang Dibutuhkan

Daftarkan akun dan ambil API key gratis di:
- [ ] https://newsapi.org — berita saham AS
- [ ] https://fred.stlouisfed.org/docs/api/api_key.html — indikator ekonomi
- [ ] https://www.exchangerate-api.com — forex
- [ ] https://supabase.com — database
- [ ] https://upstash.com — redis cache
- [ ] https://resend.com — email alert

### 💡 Skenario Arsitektur Dual-Source Emas (Post-Launch)
Untuk memberikan pengalaman analisis komoditas kelas profesional tanpa merusak limit kuota gratis, fitur emas akan memisahkan peran kedua data source:

1. **Yahoo Finance (`yfinance` - Ticker: `GC=F`)**
   - **Fokus Fitur:** Menggambar Grafik Candlestick Utama (TradingView) & Training Model ML (Prophet).
   - **Alasan:** Menyediakan data historis harian/mingguan yang sangat panjang, stabil, dan *unlimited* (bebas kuota).

2. **GoldAPI.io (XAU/IDR Spot Price)**
   - **Fokus Fitur:** Ticker Live Card ("Harga Emas Fisik Hari Ini dalam Rp/Gram") & Kalkulator Simulasi Investasi Logam Mulia.
   - **Alasan:** Menyediakan konversi instan ke Rupiah per gram secara akurat dari pasar fisik tanpa perlu dihitung manual di backend.
   - **Strategi Hemat Kuota:** Karena limit *free tier* hanya 100 request/hari, data dari GoldAPI.io wajib disimpan ke **Upstash Redis Cache** dengan masa kedaluwarsa (TTL) 2 jam. Backend hanya mengetuk API ini 12 kali sehari, sehingga aman dari limit bengkak walaupun web dibuka oleh ribuan user.

Simpan semua key di `.env.local` (frontend) dan `.env` (backend), jangan di-commit ke GitHub!