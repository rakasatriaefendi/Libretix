"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useAuthStore } from "@/lib/store";

export function AuthStatusControl() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/dashboard");
    router.refresh();
  }

  if (loading) {
    return <div className="text-xs text-white/35">Checking session...</div>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/register">Register</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="truncate text-xs text-white/45">{user.email}</div>
      <Button type="button" size="sm" variant="outline" onClick={handleSignOut} className="w-full">
        Logout
      </Button>
    </div>
  );
}
