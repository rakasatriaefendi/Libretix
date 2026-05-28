import { addWatchlistTicker, getWatchlist } from "@/lib/api";
import { useWatchlistStore } from "@/lib/store";

function normalizeTickers(tickers: string[]) {
  return [...new Set(tickers.map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))];
}

export async function syncCloudWatchlist(accessToken: string) {
  const watchlistStore = useWatchlistStore.getState();
  watchlistStore.setSyncStatus("syncing");

  try {
    const remoteItems = await getWatchlist(accessToken);
    const remoteTickers = normalizeTickers(remoteItems.map((item) => item.ticker));
    const localTickers = normalizeTickers(watchlistStore.localTickers);
    const pendingTickers = localTickers.filter((ticker) => !remoteTickers.includes(ticker));

    for (const ticker of pendingTickers) {
      await addWatchlistTicker(accessToken, ticker);
    }

    const mergedTickers = normalizeTickers([...remoteTickers, ...localTickers]);
    useWatchlistStore.getState().setCloudTickers(mergedTickers);
    useWatchlistStore.getState().clearLocalTickers();
    return mergedTickers;
  } catch (error) {
    useWatchlistStore.getState().setSyncStatus("error");
    throw error;
  }
}
