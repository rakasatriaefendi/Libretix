import type { Metadata } from "next";
import { ClientLayout } from "./ClientLayout";

export const metadata: Metadata = {
  title: "Libretix",
  description: "Stocks. Crypto. News. Free. — Open-source market dashboard for US stocks, IDX, and crypto with price predictions.",
  openGraph: {
    title: "Libretix",
    description: "Stocks. Crypto. News. Free.",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Libretix",
    description: "Stocks. Crypto. News. Free.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <ClientLayout>{children}</ClientLayout>
    </html>
  );
}
