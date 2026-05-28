"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useAuthStore } from "@/lib/store";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.loading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const redirectTo = useMemo(() => searchParams.get("redirect") ?? "/watchlist", [searchParams]);

  useEffect(() => {
    if (!authLoading && user) {
      window.location.replace(redirectTo);
    }
  }, [authLoading, redirectTo, user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const supabase = getSupabaseBrowserClient();

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
        window.location.replace(redirectTo);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        window.location.replace(redirectTo);
        return;
      }

      setMessage("Account created. Check your email to confirm your account, then log in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
      <Card className="w-full">
        <CardHeader>
          <h1 className="text-2xl font-semibold">{mode === "login" ? "Login" : "Create Account"}</h1>
          <p className="text-sm text-white/45">
            {mode === "login"
              ? "Masuk untuk menyimpan watchlist Anda di cloud dan sinkron antar perangkat."
              : "Buat akun untuk menyimpan watchlist personal Anda di Libretix."}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-white/70" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/70" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />
            </div>

            {error && <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div>}
            {message && <div className="rounded-lg border border-[#00d964]/20 bg-[#00d964]/10 p-3 text-sm text-[#9ff2c2]">{message}</div>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 text-sm text-white/45">
            {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
            <Link
              href={mode === "login" ? `/register?redirect=${encodeURIComponent(redirectTo)}` : `/login?redirect=${encodeURIComponent(redirectTo)}`}
              className="text-[#00d964] hover:text-[#7ff0b1]"
            >
              {mode === "login" ? "Register" : "Login"}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
