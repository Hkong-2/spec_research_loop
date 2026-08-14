"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { API_BASE_URL, getStoredToken, setStoredToken } from "@/lib/api";
import { useMeApiIdentityMeGet } from "@/lib/api/generated/endpoints";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const [token, setToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setToken(getStoredToken());
  }, []);

  const meQuery = useMeApiIdentityMeGet({
    query: { enabled: Boolean(token), retry: false },
  });

  const email = meQuery.data?.status === 200 ? meQuery.data.data.email : null;
  const status = !token
    ? "Signed out"
    : meQuery.isLoading
      ? "Checking session…"
      : email
        ? "Signed in"
        : "Signed out (token invalid)";

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>SpecResearch Loop</CardTitle>
        <CardDescription>
          SPA shell over FastAPI. API base: <code>{API_BASE_URL}</code>
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p>
          Status: <strong>{status}</strong>
          {email ? (
            <>
              {" "}
              as <code>{email}</code>
            </>
          ) : null}
        </p>
        {email ? (
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            onClick={() => {
              setStoredToken(null);
              setToken(null);
              queryClient.clear();
            }}
          >
            Sign out
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
