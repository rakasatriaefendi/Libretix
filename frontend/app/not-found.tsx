import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-[color:var(--border-color)] bg-[var(--surface)] p-8 text-center">
      <div className="text-sm tracking-[0.2em] text-[#00d964]">LIBRETIX</div>
      <h1 className="mt-3 text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-[color:var(--text-muted)]">The requested ticker or page does not exist.</p>
      <Link className="mt-6 inline-flex rounded-md bg-[#00d964] px-4 py-2 text-sm font-medium text-black" href="/dashboard">
        Back to dashboard
      </Link>
    </div>
  );
}
