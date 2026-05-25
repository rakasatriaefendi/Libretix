import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, Newspaper, Search, Star, LayoutDashboard } from "lucide-react";
import "./globals.css";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { RealTimeClock } from "@/components/RealTimeClock";

export const metadata: Metadata = {
  title: "Libretix",
  description: "Bloomberg-style market terminal for US, IDX, and crypto."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-zinc-100">
        <div className="flex min-h-screen">
          <aside className="hidden w-64 border-r border-white/10 bg-black/40 px-4 py-5 lg:flex lg:flex-col">
            <Link href="/dashboard" className="mb-8 text-xl font-semibold tracking-[0.2em] text-[#00d964]">
              LIBRETIX
            </Link>
            <nav className="flex flex-col gap-2 text-sm">
              <Link className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-white/5" href="/dashboard"><LayoutDashboard size={16} /> Dashboard</Link>
              <Link className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-white/5" href="/watchlist"><Star size={16} /> Watchlist</Link>
              <Link className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-white/5" href="/news"><Newspaper size={16} /> News</Link>
            </nav>
            <div className="mt-auto text-xs text-white/35">Real-time terminal shell</div>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur">
              <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="lg:hidden text-[#00d964] font-semibold tracking-[0.2em]">LIBRETIX</div>
                  <div className="relative w-full max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={16} />
                    <Input className="pl-9" placeholder="Search ticker..." aria-label="Search ticker" />
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/60">
                  <Clock3 size={14} className="text-[#00d964]" />
                  <RealTimeClock />
                </div>
              </div>
              <Separator />
            </header>
            <main className="flex-1 p-4 lg:p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
