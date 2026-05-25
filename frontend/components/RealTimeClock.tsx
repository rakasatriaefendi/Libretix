"use client";

import { useEffect, useState } from "react";

export function RealTimeClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <span suppressHydrationWarning>{now.toLocaleString()}</span>;
}
