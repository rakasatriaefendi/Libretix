"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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

function highlightTitle(title: string, query: string) {
  if (!query.trim()) return title;
  const lowerTitle = title.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerTitle.indexOf(lowerQuery);
  if (idx < 0) return title;
  return (
    <>
      {title.slice(0, idx)}
      <span className="text-[#00d964]">{title.slice(idx, idx + query.length)}</span>
      {title.slice(idx + query.length)}
    </>
  );
}

function SentimentBadge({ sentiment }: { sentiment: string | null }) {
  if (!sentiment) return null;
  const styles = {
    positive: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    negative: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
    neutral: "bg-white/10 text-white/50 border border-white/10",
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${styles[sentiment as keyof typeof styles] ?? styles.neutral}`}>
      {sentiment}
    </span>
  );
}

function ImpactDot({ impact }: { impact: string | null }) {
  if (!impact) return null;
  const colors = { high: "bg-rose-400", medium: "bg-yellow-400", low: "bg-white/30" };
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${colors[impact as keyof typeof colors] ?? colors.low}`} />;
}

function formatPublishedAt(publishedAt: string) {
  const publishedDate = new Date(publishedAt);
  if (Number.isNaN(publishedDate.getTime())) return null;

  const now = new Date();
  const diffMs = now.getTime() - publishedDate.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "just now";
  if (diffHours < 1) return `${diffMinutes} minutes ago`;
  if (diffDays < 1) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;

  const day = String(publishedDate.getDate()).padStart(2, "0");
  const month = publishedDate.toLocaleString("en-US", { month: "short" });
  const year = publishedDate.getFullYear();
  return `${day} ${month} ${year}`;
}

function NewsCard({ item }: { item: NewsItem }) {
  const published = item.published_at ? formatPublishedAt(item.published_at) : null;

  return (
    <a
      href={item.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-white/10 bg-[#111111] p-4 transition hover:border-[#00d964]/30 hover:bg-[#111111]/80"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <SentimentBadge sentiment={item.sentiment} />
            <ImpactDot impact={item.impact} />
            {item.source && <span className="text-xs text-white/40">{item.source}</span>}
            {published && <span className="text-xs text-white/30">{published}</span>}
          </div>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-white/90 group-hover:text-white">
            {item.title}
          </h3>
          {item.summary_en && (
            <p className="mt-1.5 line-clamp-2 text-xs text-white/50">
              {item.summary_en}
            </p>
          )}
          {item.tickers_affected && item.tickers_affected.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.tickers_affected.slice(0, 5).map((ticker) => (
                <Link
                  key={ticker}
                  href={`/stock/${encodeURIComponent(ticker)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded bg-[#00d964]/10 px-1.5 py-0.5 text-xs text-[#00d964] hover:bg-[#00d964]/20"
                >
                  {ticker}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}

function StatBar({ label, value, pct, color, barColor }: { label: string; value: number; pct: number; color: string; barColor: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`w-16 text-xs font-medium ${color}`}>{label}</span>
      <div className="h-1.5 flex-1 rounded-full bg-white/10">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.max(pct, 0.5)}%` }} />
      </div>
      <span className="w-12 text-right text-xs text-white/40">{value} ({pct}%)</span>
    </div>
  );
}

export function NewsClient({
  news,
  stats,
}: {
  news: NewsItem[];
  stats: NewsStats | null;
}) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedSentiment, setSelectedSentiment] = useState<string | undefined>(undefined);
  const [tickerQuery, setTickerQuery] = useState("");
  const [selectedTicker, setSelectedTicker] = useState<string | undefined>(undefined);

  const normalizedQuery = query.trim().toLowerCase();
  const availableTickers = useMemo(() => {
    const tickerCounts = new Map<string, number>();
    news.forEach((item) => {
      item.tickers_affected?.forEach((ticker) => {
        tickerCounts.set(ticker, (tickerCounts.get(ticker) ?? 0) + 1);
      });
    });
    return [...tickerCounts.entries()]
      .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
      .map(([ticker]) => ticker);
  }, [news]);
  const tickerSuggestions = useMemo(() => {
    const normalizedTickerQuery = tickerQuery.trim().toUpperCase();
    if (!normalizedTickerQuery) return availableTickers.slice(0, 10);
    return availableTickers.filter((ticker) => ticker.includes(normalizedTickerQuery)).slice(0, 10);
  }, [availableTickers, tickerQuery]);
  const suggestions = useMemo(() => {
    if (!normalizedQuery) return [];
    return news
      .filter((item) => item.title.toLowerCase().includes(normalizedQuery))
      .slice(0, 5);
  }, [news, normalizedQuery]);

  const filteredNews = useMemo(() => {
    const term = submittedQuery.trim().toLowerCase();
    return news.filter((item) => {
      const matchesSearch = !term || item.title.toLowerCase().includes(term);
      const matchesSentiment = !selectedSentiment || item.sentiment === selectedSentiment;
      const matchesTicker = !selectedTicker || (item.tickers_affected ?? []).includes(selectedTicker);
      return matchesSearch && matchesSentiment && matchesTicker;
    });
  }, [news, selectedSentiment, selectedTicker, submittedQuery]);

  const visibleNews = filteredNews.slice(0, visibleCount);
  const hasMore = visibleCount < filteredNews.length;

  function clearTextSearch() {
    setQuery("");
    setSubmittedQuery("");
    setVisibleCount(20);
  }

  function submitSearch() {
    const next = query.trim();
    setSubmittedQuery(next);
    setVisibleCount(20);
  }

  function applyTickerFilter(value: string) {
    const normalizedTicker = value.trim().toUpperCase();
    if (!normalizedTicker) {
      setSelectedTicker(undefined);
      setTickerQuery("");
      setVisibleCount(20);
      return;
    }

    const matchedTicker =
      availableTickers.find((ticker) => ticker === normalizedTicker) ??
      availableTickers.find((ticker) => ticker.startsWith(normalizedTicker)) ??
      availableTickers.find((ticker) => ticker.includes(normalizedTicker));

    setSelectedTicker(matchedTicker ?? normalizedTicker);
    setTickerQuery(matchedTicker ?? normalizedTicker);
    setVisibleCount(20);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Market News</h1>
          <p className="text-sm text-white/45">{filteredNews.length} artikel terbaru dari berbagai sumber</p>
        </div>
      </div>

      {stats && stats.total > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#111111] p-4">
          <h2 className="mb-3 text-xs font-semibold tracking-[0.2em] text-[#00d964]">MARKET SENTIMENT</h2>
          <div className="space-y-2">
            <StatBar label="Positive" value={stats.positive} pct={stats.positive_pct} color="text-emerald-400" barColor="bg-emerald-400" />
            <StatBar label="Negative" value={stats.negative} pct={stats.negative_pct} color="text-rose-400" barColor="bg-rose-400" />
            <StatBar label="Neutral" value={stats.neutral} pct={stats.neutral_pct} color="text-white/40" barColor="bg-white/30" />
          </div>
        </div>
      )}

      <div className="relative">
        <input
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            if (!value.trim()) {
              clearTextSearch();
            } else {
              setVisibleCount(20);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              submitSearch();
            }
            if (event.key === "Escape") {
              clearTextSearch();
              setTickerQuery("");
              setSelectedTicker(undefined);
              setSelectedSentiment(undefined);
            }
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            window.setTimeout(() => setIsFocused(false), 150);
          }}
          placeholder="Search news..."
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#00d964]/40"
        />

        {isFocused && normalizedQuery && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-white/10 bg-[#111111]">
            {suggestions.map((item) => (
              <a
                key={item.id}
                href={item.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 border-b border-white/10 px-4 py-3 last:border-b-0 hover:bg-white/5"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <SentimentBadge sentiment={item.sentiment} />
                    {item.source && <span className="text-xs text-white/40">{item.source}</span>}
                  </div>
                  <div className="line-clamp-2 text-sm text-white/90">
                    {highlightTitle(item.title, query)}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={tickerQuery}
            onChange={(event) => setTickerQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                applyTickerFilter(tickerQuery);
              }
            }}
            placeholder="Filter by ticker..."
            className="min-w-[220px] flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#00d964]/40"
          />
          <button
            type="button"
            onClick={() => applyTickerFilter(tickerQuery)}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/20 hover:text-white"
          >
            Apply Ticker
          </button>
          {selectedTicker && (
            <button
              type="button"
              onClick={() => applyTickerFilter("")}
              className="rounded-lg border border-[#00d964]/40 bg-[#00d964]/10 px-3 py-1.5 text-xs font-medium text-[#00d964]"
            >
              {selectedTicker} x
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {tickerSuggestions.map((ticker) => (
            <button
              key={ticker}
              type="button"
              onClick={() => applyTickerFilter(ticker)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                selectedTicker === ticker
                  ? "border-[#00d964]/50 bg-[#00d964]/10 text-[#00d964]"
                  : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"
              }`}
            >
              {ticker}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: "All", value: undefined },
          { label: "Positive", value: "positive" },
          { label: "Negative", value: "negative" },
          { label: "Neutral", value: "neutral" },
        ].map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => {
              setSelectedSentiment(f.value);
              clearTextSearch();
              setVisibleCount(20);
            }}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              selectedSentiment === f.value || (!selectedSentiment && !f.value)
                ? "border-[#00d964]/50 bg-[#00d964]/10 text-[#00d964]"
                : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visibleNews.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#111111] p-8 text-center text-sm text-white/40">
          Tidak ada berita ditemukan.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleNews.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((value) => value + 20)}
            className="rounded-md border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-white/20 hover:text-white"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
