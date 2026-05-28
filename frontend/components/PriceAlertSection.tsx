"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Trash2 } from "lucide-react";
import { createAlert, deleteAlert, formatCurrency, getAlerts } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { Market, PriceAlert } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PriceAlertSection({
  ticker,
  currentPrice,
  market,
}: {
  ticker: string;
  currentPrice: number;
  market?: Market;
}) {
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  const authLoading = useAuthStore((state) => state.loading);
  const [targetPrice, setTargetPrice] = useState(() => currentPrice.toString());
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingAlertId, setDeletingAlertId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTargetPrice(currentPrice.toString());
  }, [currentPrice, ticker]);

  useEffect(() => {
    const accessToken = session?.access_token;
    if (!accessToken) {
      setAlerts([]);
      return;
    }
    const token = accessToken;

    let cancelled = false;
    async function loadAlerts() {
      setLoadingAlerts(true);
      setError(null);
      try {
        const data = await getAlerts(token);
        if (!cancelled) {
          setAlerts(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load alerts");
        }
      } finally {
        if (!cancelled) {
          setLoadingAlerts(false);
        }
      }
    }

    void loadAlerts();
    return () => {
      cancelled = true;
    };
  }, [session?.access_token]);

  const tickerAlerts = useMemo(
    () => alerts.filter((alert) => alert.ticker.toUpperCase() === ticker.toUpperCase()),
    [alerts, ticker]
  );

  if (authLoading || !user || !session?.access_token) {
    return null;
  }

  async function handleCreateAlert() {
    const accessToken = session?.access_token;
    if (!accessToken) return;

    const parsedTargetPrice = Number(targetPrice);
    if (!Number.isFinite(parsedTargetPrice) || parsedTargetPrice <= 0) {
      setError("Please enter a valid target price.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const newAlert = await createAlert(accessToken, ticker, parsedTargetPrice, condition);
      setAlerts((current) => [newAlert, ...current]);
      setTargetPrice(currentPrice.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create alert");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAlert(alertId: string) {
    const accessToken = session?.access_token;
    if (!accessToken) return;

    setDeletingAlertId(alertId);
    setError(null);
    try {
      await deleteAlert(accessToken, alertId);
      setAlerts((current) => current.filter((alert) => alert.id !== alertId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete alert");
    } finally {
      setDeletingAlertId(null);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="flex items-center gap-2">
        <Bell size={14} className="text-[#00d964]" />
        <h2 className="text-xs font-semibold tracking-[0.2em] text-[#00d964]">PRICE ALERT</h2>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={targetPrice}
          onChange={(event) => setTargetPrice(event.target.value)}
          placeholder="Target price"
        />
        <select
          value={condition}
          onChange={(event) => setCondition(event.target.value as "above" | "below")}
          className="h-9 rounded-md border border-white/10 bg-black/60 px-3 text-sm text-white outline-none focus-visible:ring-1 focus-visible:ring-[#00d964]/60"
        >
          <option value="above">Above</option>
          <option value="below">Below</option>
        </select>
        <Button type="button" onClick={handleCreateAlert} disabled={submitting}>
          {submitting ? "Saving..." : "Set Alert"}
        </Button>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="mt-3 text-xs text-white/45">
        Current price: {formatCurrency(currentPrice, market, ticker)}
      </div>

      <div className="mt-3 space-y-2">
        {loadingAlerts ? (
          <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-white/45">
            Loading alerts...
          </div>
        ) : tickerAlerts.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-white/45">
            No active alerts for {ticker}.
          </div>
        ) : (
          tickerAlerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-white/90">
                  {alert.condition === "above" ? "Above" : "Below"} {formatCurrency(Number(alert.target_price), market, ticker)}
                </div>
                <div className="text-xs text-white/45">{ticker}</div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteAlert(alert.id)}
                disabled={deletingAlertId === alert.id}
                className="text-rose-300 hover:text-rose-200"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
