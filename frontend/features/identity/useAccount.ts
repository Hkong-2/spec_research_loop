"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { getStoredToken, setStoredToken, TOKEN_CHANGE_EVENT } from "@/lib/api";
import {
  getMeApiIdentityMeGetQueryKey,
  useMeApiIdentityMeGet,
} from "@/lib/api/generated/endpoints";

export function useAccount() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const sync = () => setToken(getStoredToken());
    sync();
    setReady(true);
    window.addEventListener(TOKEN_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(TOKEN_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const meQuery = useMeApiIdentityMeGet({
    query: { enabled: Boolean(token), retry: false },
  });

  const email = meQuery.data?.status === 200 ? meQuery.data.data.email : null;

  function signOut() {
    setStoredToken(null);
    queryClient.removeQueries({ queryKey: getMeApiIdentityMeGetQueryKey() });
  }

  return {
    ready,
    email,
    hasToken: Boolean(token),
    signedIn: Boolean(email),
    isLoading: Boolean(token) && meQuery.isLoading,
    signOut,
  };
}
