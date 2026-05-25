"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6">
      <h2 className="text-lg font-semibold text-rose-300">Stock detail failed to load</h2>
      <p className="mt-2 text-sm text-rose-200/80">{error.message}</p>
      <button className="mt-4 rounded-md bg-[#00d964] px-4 py-2 text-sm font-medium text-black" onClick={() => reset()}>
        Retry
      </button>
    </div>
  );
}
