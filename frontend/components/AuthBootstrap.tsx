"use client";

import { useEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useAuthStore, useWatchlistStore } from "@/lib/store";
import { syncCloudWatchlist } from "@/lib/watchlist-sync";

export function AuthBootstrap() {
  const setAuthState = useAuthStore((state) => state.setAuthState);
  const clearAuthState = useAuthStore((state) => state.clearAuthState);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setSignedOutState = useWatchlistStore((state) => state.setSignedOutState);
  const lastSyncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let mounted = true;

    async function handleSession() {
      setLoading(true);
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session?.user) {
        clearAuthState();
        setSignedOutState();
        lastSyncedUserIdRef.current = null;
        return;
      }

      setAuthState({ user: session.user, session, loading: false });
      if (lastSyncedUserIdRef.current !== session.user.id) {
        try {
          await syncCloudWatchlist(session.access_token);
          lastSyncedUserIdRef.current = session.user.id;
        } catch {
          lastSyncedUserIdRef.current = session.user.id;
        }
      }
    }

    void handleSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (!session?.user) {
        clearAuthState();
        setSignedOutState();
        lastSyncedUserIdRef.current = null;
        return;
      }

      setAuthState({ user: session.user, session, loading: false });
      if (lastSyncedUserIdRef.current !== session.user.id) {
        void syncCloudWatchlist(session.access_token)
          .catch(() => undefined)
          .then(() => {
            lastSyncedUserIdRef.current = session.user.id;
          });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [clearAuthState, setAuthState, setLoading, setSignedOutState]);

  return null;
}
