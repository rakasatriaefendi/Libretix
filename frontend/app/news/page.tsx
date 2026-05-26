import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type NewsItem = {
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

type NewsStats = {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  positive_pct: number;
  negative_pct: number;
  neutral_pct: number;
};

async function getNews(sentiment?: string): Promise<NewsItem[]> {
  try {
    const params = new URLSearchParams({ limit: "50" });
    if (sentiment) params.set("sentiment", sentiment);
    const res = await fetch(`${API_URL}/news/?${params}`, {
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
    const res = await fetch(`${API_URL}/news/stats`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function SentimentBadge({ sentiment }: { sentiment: string | null }) {
  if (!sentiment) return null;
  const styles = {
    positive: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    negative: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
    neutral:  "bg-white/10 text-white/50 border border-white/10",
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
  return (
    <span className={`inline-block h-1.5 w-1.5 rounded-full ${colors[impact as keyof typeof colors] ?? colors.low}`} />
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const published = item.published_at
    ? new Date(item.published_at).toLocaleDateString("id-ID", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <a
      href={item.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-white/10 bg-[#111111] p-4 transition hover:border-[#00d964]/30 hover:bg-[#111111]/80"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <SentimentBadge sentiment={item.sentiment} />
            <ImpactDot impact={item.impact} />
            {item.source && (
              <span className="text-xs text-white/40">{item.source}</span>
            )}
            {published && (
              <span className="text-xs text-white/30">{published}</span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-medium leading-snug text-white/90 group-hover:text-white line-clamp-2">
            {item.title}
          </h3>

          {/* Summary */}
          {item.summary_en && (
            <p className="mt-1.5 text-xs text-white/50 line-clamp-2">
              {item.summary_en}
            </p>
          )}

          {/* Tickers */}
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

function StatBar({ label, value, pct, color }: {
  label: string; value: number; pct: number; color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`w-16 text-xs font-medium ${color}`}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/10">
        <div className={`h-full rounded-full ${color.replace("text-", "bg-")}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right text-xs text-white/40">{value} ({pct}%)</span>
    </div>
  );
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams?: { sentiment?: string };
}) {
  const sentiment = searchParams?.sentiment;
  const [news, stats] = await Promise.all([getNews(sentiment), getStats()]);

  const filters = [
    { label: "All", value: undefined },
    { label: "Positive", value: "positive" },
    { label: "Negative", value: "negative" },
    { label: "Neutral",  value: "neutral" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Market News</h1>
          <p className="text-sm text-white/45">
            {news.length} artikel terbaru dari berbagai sumber
          </p>
        </div>
      </div>

      {/* Sentiment Stats */}
      {stats && stats.total > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#111111] p-4">
          <h2 className="mb-3 text-xs font-semibold tracking-[0.2em] text-[#00d964]">
            MARKET SENTIMENT
          </h2>
          <div className="space-y-2">
            <StatBar label="Positive" value={stats.positive} pct={stats.positive_pct} color="text-emerald-400" />
            <StatBar label="Negative" value={stats.negative} pct={stats.negative_pct} color="text-rose-400" />
            <StatBar label="Neutral"  value={stats.neutral}  pct={stats.neutral_pct}  color="text-white/40" />
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const isActive = sentiment === f.value || (!sentiment && !f.value);
          const href = f.value ? `/news?sentiment=${f.value}` : "/news";
          return (
            <Link
              key={f.label}
              href={href}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                isActive
                  ? "border-[#00d964]/50 bg-[#00d964]/10 text-[#00d964]"
                  : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* News Grid */}
      {news.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#111111] p-8 text-center text-sm text-white/40">
          Tidak ada berita ditemukan.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {news.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}