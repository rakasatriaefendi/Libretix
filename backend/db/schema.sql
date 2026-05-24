-- ============================================================
-- Libretix OSS — Supabase Schema
-- Run ini di Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------
-- Tabel: stock_prices
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_prices (
  id        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker    VARCHAR(20) NOT NULL,
  price     DECIMAL(12,4),
  open      DECIMAL(12,4),
  high      DECIMAL(12,4),
  low       DECIMAL(12,4),
  volume    BIGINT,
  market    VARCHAR(10),  -- 'US', 'IDX', 'CRYPTO'
  timestamp TIMESTAMPTZ  DEFAULT NOW()
);

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_stock_ticker ON stock_prices(ticker);
CREATE INDEX IF NOT EXISTS idx_stock_timestamp ON stock_prices(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_stock_market ON stock_prices(market);

-- -------------------------------------------------------
-- Tabel: news
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS news (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT        NOT NULL,
  url             TEXT,
  source          VARCHAR(100),
  summary_id      TEXT,
  summary_en      TEXT,
  sentiment       VARCHAR(10),       -- positive|negative|neutral
  sentiment_score INT,               -- 0-100
  impact          VARCHAR(10),       -- high|medium|low
  tickers_affected TEXT[],           -- array of tickers
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_sentiment ON news(sentiment);
-- GIN index untuk array search
CREATE INDEX IF NOT EXISTS idx_news_tickers ON news USING GIN(tickers_affected);

-- -------------------------------------------------------
-- Tabel: predictions
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictions (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker           VARCHAR(20) NOT NULL,
  predicted_price  DECIMAL(12,4),
  confidence_low   DECIMAL(12,4),
  confidence_high  DECIMAL(12,4),
  prediction_date  DATE,
  model_used       VARCHAR(50),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pred_ticker ON predictions(ticker);
CREATE INDEX IF NOT EXISTS idx_pred_date ON predictions(prediction_date);

-- -------------------------------------------------------
-- Tabel: watchlists (Phase 5, sudah disiapkan)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS watchlists (
  id       UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id  UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker   VARCHAR(20) NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ticker)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlists(user_id);

-- -------------------------------------------------------
-- Row Level Security (RLS) — untuk watchlists
-- -------------------------------------------------------
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own watchlist"
  ON watchlists
  FOR ALL
  USING (auth.uid() = user_id);

-- stock_prices & news bisa dibaca semua orang (public read)
ALTER TABLE stock_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read stock_prices"
  ON stock_prices FOR SELECT USING (true);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read news"
  ON news FOR SELECT USING (true);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read predictions"
  ON predictions FOR SELECT USING (true);

-- -------------------------------------------------------
-- Function: cleanup data lama (jalankan manual atau cron)
-- Hapus stock_prices > 90 hari untuk hemat storage
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_old_stock_prices()
RETURNS void AS $$
BEGIN
  DELETE FROM stock_prices
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
