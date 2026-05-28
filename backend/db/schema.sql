-- ============================================================
-- Libretix OSS - Supabase Schema
-- Run this in Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------
-- Table: stock_prices
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
  timestamp TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_ticker ON stock_prices(ticker);
CREATE INDEX IF NOT EXISTS idx_stock_timestamp ON stock_prices(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_stock_market ON stock_prices(market);

-- -------------------------------------------------------
-- Table: news
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS news (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title            TEXT        NOT NULL,
  url              TEXT,
  source           VARCHAR(100),
  summary_id       TEXT,
  summary_en       TEXT,
  sentiment        VARCHAR(10),  -- positive|negative|neutral
  sentiment_score  INT,          -- 0-100
  impact           VARCHAR(10),  -- high|medium|low
  tickers_affected TEXT[],
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_sentiment ON news(sentiment);
CREATE INDEX IF NOT EXISTS idx_news_tickers ON news USING GIN(tickers_affected);

-- -------------------------------------------------------
-- Table: predictions
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
-- Table: watchlists
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
-- Table: price_alerts
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS price_alerts (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker        TEXT        NOT NULL,
  target_price  NUMERIC     NOT NULL,
  condition     TEXT        NOT NULL CHECK (condition IN ('above', 'below')),
  is_triggered  BOOLEAN     DEFAULT FALSE,
  triggered_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_ticker ON price_alerts(ticker);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_triggered ON price_alerts(is_triggered);

-- -------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own watchlist"
  ON watchlists
  FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alerts"
  ON price_alerts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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
-- Cleanup helper
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_old_stock_prices()
RETURNS void AS $$
BEGIN
  DELETE FROM stock_prices
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
