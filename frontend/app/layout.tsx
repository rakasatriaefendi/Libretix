"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock3, Newspaper, Search, Star, LayoutDashboard } from "lucide-react";
import "./globals.css";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { RealTimeClock } from "@/components/RealTimeClock";
import { useUiStore } from "@/lib/store";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const search = useUiStore((state) => state.search);
  const setSearch = useUiStore((state) => state.setSearch);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-zinc-100 overflow-hidden">
        <div className="flex h-screen overflow-hidden">

          {/* Overlay mobile */}
          {sidebarOpen && (
            <button
              type="button"
              aria-label="Close sidebar"
              className="fixed inset-0 z-30 bg-black/60 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            className={[
              "fixed inset-y-0 left-0 z-40 w-64 h-screen overflow-hidden border-r border-white/10 bg-black/90 px-4 py-5 backdrop-blur transition-transform duration-200 md:static md:translate-x-0 md:flex md:flex-col",
              sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            ].join(" ")}
          >
            <div className="flex h-full flex-col overflow-hidden">
              <Link href="/dashboard" className="mb-8 text-xl font-semibold tracking-[0.2em] text-[#00d964]">
                LIBRETIX
              </Link>
              <nav className="flex flex-1 flex-col gap-2 overflow-y-auto text-sm">
                <Link className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-white/5" href="/dashboard">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <Link className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-white/5" href="/watchlist">
                  <Star size={16} /> Watchlist
                </Link>
                <Link className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-white/5" href="/news">
                  <Newspaper size={16} /> News
                </Link>
              </nav>
              <div className="mt-auto text-xs text-white/35">Real-time terminal shell</div>
            </div>
          </aside>

          {/* Main area */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden h-screen">

            {/* Topbar */}
            <header className="shrink-0 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur">
              <div className="flex items-center justify-between gap-3 px-4 py-3">

                {/* Kiri: hamburger + logo mobile + search */}
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    aria-label="Toggle sidebar"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black/40 text-white/80 md:hidden"
                    onClick={() => setSidebarOpen((v) => !v)}
                  >
                    <span className="flex flex-col gap-1.5">
                      <span className="block h-0.5 w-4 bg-current" />
                      <span className="block h-0.5 w-4 bg-current" />
                      <span className="block h-0.5 w-4 bg-current" />
                    </span>
                  </button>

                  <div className="lg:hidden text-[#00d964] font-semibold tracking-[0.2em]">LIBRETIX</div>

                  {/* Search ticker — hanya di dashboard */}
                  {pathname === "/dashboard" && (
                    <div className="relative w-full max-w-md">
                      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={16} />
                      <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="pl-9"
                        placeholder="Search ticker..."
                        aria-label="Search ticker"
                      />
                    </div>
                  )}
                </div>

                {/* Kanan: clock */}
                <div className="flex shrink-0 items-center gap-2 text-xs text-white/60">
                  <Clock3 size={14} className="text-[#00d964]" />
                  <RealTimeClock />
                </div>

              </div>
              <Separator />
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-4 lg:p-6">
              {children}
            </main>

          </div>
        </div>
      </body>
    </html>
  );
}
