"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Clock3, Newspaper, Search, Star, LayoutDashboard } from "lucide-react";
import "./globals.css";
import { AuthBootstrap } from "@/components/AuthBootstrap";
import { AuthStatusControl } from "@/components/AuthStatusControl";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import { RealTimeClock } from "@/components/RealTimeClock";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useThemeStore, useUiStore } from "@/lib/store";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const search = useUiStore((state) => state.search);
  const setSearch = useUiStore((state) => state.setSearch);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return (
    <body className="overflow-hidden bg-[var(--page-bg)] text-[color:var(--text-primary)]">
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){try{var raw=localStorage.getItem('libretix-theme');if(!raw)return;var parsed=JSON.parse(raw);var theme=parsed&&parsed.state&&parsed.state.theme;if(theme==='light'||theme==='dark'){document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;}}catch(e){}})();"
        }}
      />
      <AuthBootstrap />
      <div className="flex h-screen overflow-hidden">

        {/* Overlay mobile */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            className="fixed inset-0 z-30 bg-[var(--overlay)] md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={[
            "fixed inset-y-0 left-0 z-40 h-screen w-64 overflow-hidden border-r border-[color:var(--border-color)] bg-[var(--sidebar-bg)] px-4 py-5 backdrop-blur transition-transform duration-200 md:static md:translate-x-0 md:flex md:flex-col",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          ].join(" ")}
        >
          <div className="flex h-full flex-col overflow-hidden">
            <Link href="/dashboard" className="mb-8 text-xl font-semibold tracking-[0.2em] text-[color:var(--accent)]">
              LIBRETIX
            </Link>
            <nav className="flex flex-1 flex-col gap-2 overflow-y-auto text-sm text-[color:var(--text-secondary)]">
              <Link className="flex items-center gap-2 rounded-md px-3 py-2 transition hover:bg-[var(--surface-hover)] hover:text-[color:var(--text-primary)]" href="/dashboard">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link className="flex items-center gap-2 rounded-md px-3 py-2 transition hover:bg-[var(--surface-hover)] hover:text-[color:var(--text-primary)]" href="/watchlist">
                <Star size={16} /> Watchlist
              </Link>
              <Link className="flex items-center gap-2 rounded-md px-3 py-2 transition hover:bg-[var(--surface-hover)] hover:text-[color:var(--text-primary)]" href="/news">
                <Newspaper size={16} /> News
              </Link>
            </nav>
            <div className="mt-4 border-t border-[color:var(--border-color)] pt-4">
              <AuthStatusControl />
            </div>
            <div className="mt-auto text-xs text-[color:var(--text-faint)]">Real-time terminal shell</div>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">

          {/* Topbar */}
          <header className="shrink-0 border-b border-[color:var(--border-color)] bg-[var(--page-shell)] backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-3">

              {/* Kiri: hamburger + logo mobile + search */}
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  aria-label="Toggle sidebar"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[color:var(--border-color)] bg-[var(--surface-muted)] text-[color:var(--text-secondary)] md:hidden"
                  onClick={() => setSidebarOpen((v) => !v)}
                >
                  <span className="flex flex-col gap-1.5">
                    <span className="block h-0.5 w-4 bg-current" />
                    <span className="block h-0.5 w-4 bg-current" />
                    <span className="block h-0.5 w-4 bg-current" />
                  </span>
                </button>

                <div className="font-semibold tracking-[0.2em] text-[color:var(--accent)] lg:hidden">LIBRETIX</div>

                {/* Search ticker â€” hanya di dashboard */}
                {pathname === "/dashboard" && (
                  <div className="relative w-full max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" size={16} />
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
              <div className="flex shrink-0 items-center gap-2 text-xs text-[color:var(--text-muted)]">
                <ThemeToggleButton />
                <Clock3 size={14} className="text-[color:var(--accent)]" />
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
  );
}
