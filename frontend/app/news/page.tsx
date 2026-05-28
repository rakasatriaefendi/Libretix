import { NewsClient } from "@/components/NewsClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getApiBaseUrl() {
  if (!API_URL) return null;
  const parsed = new URL(API_URL);
  const isLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (!isLocalhost && parsed.protocol === "http:") {
    parsed.protocol = "https:";
  }
  return parsed.toString().replace(/\/$/, "");
}

export type NewsItem = {
  id: string;
  title: string;
  url: string | null;
  source: string | null;
  summary_en: string | null;
  summary_id: string | null;
  sentiment: "positive" | "negative" | "neutral" | null;
  sentiment_score: number | null;
  impact: "high" | "medium" | "low" | null;
  tickers_affected: string[] | null;
  published_at: string | null;
};

export type NewsStats = {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  positive_pct: number;
  negative_pct: number;
  neutral_pct: number;
};

async function getNews(): Promise<NewsItem[]> {
  try {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) return [];
    const params = new URLSearchParams({ limit: "100" });
    const res = await fetch(`${apiBaseUrl}/news/?${params}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getStats(): Promise<NewsStats | null> {
  try {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) return null;
    const res = await fetch(`${apiBaseUrl}/news/stats`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function NewsPage() {
  const [news, stats] = await Promise.all([getNews(), getStats()]);
  return <NewsClient news={news} stats={stats} />;
}
