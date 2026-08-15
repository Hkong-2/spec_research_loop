"use client";

import { FormEvent, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/config";
import {
  getGetSessionApiLoopSessionsSessionIdGetQueryKey,
  getListSessionsApiLoopSessionsGetQueryKey,
  useGetSessionApiLoopSessionsSessionIdGet,
  usePatchSessionApiLoopSessionsSessionIdPatch,
} from "@/lib/api/generated/endpoints";

import { useLoopSessionSave } from "./loop-session-save";
import { type SaveStatus } from "./mutation-queue";
import { isVersionConflict, operationalError } from "./operational-error";

type Conflict = {
  localTitle: string;
  serverTitle: string | null;
  serverVersion: number;
};

const STATUS_LABEL: Record<SaveStatus, string | null> = {
  idle: null,
  saving: "Saving…",
  saved: "Saved",
  failed: "Save failed",
  conflict: "Resolve conflict",
};

export function LoopSessionTitleEditor({ sessionId }: { sessionId: string }) {
  const queryClient = useQueryClient();
  const sessionQuery = useGetSessionApiLoopSessionsSessionIdGet(sessionId);
  const patchTitle = usePatchSessionApiLoopSessionsSessionIdPatch();
  const { queue, status, setStatus } = useLoopSessionSave();
  const [title, setTitle] = useState("");
  const [dirty, setDirty] = useState(false);
  const [conflict, setConflict] = useState<Conflict | null>(null);

  const session = sessionQuery.data?.status === 200 ? sessionQuery.data.data : null;

  useEffect(() => {
    if (session && !dirty && !conflict) {
      setTitle(session.title ?? "");
    }
  }, [conflict, dirty, session]);

  async function saveTitle(localTitle: string, expectedVersion: number) {
    try {
      const response = await queue.enqueue(() =>
        patchTitle.mutateAsync({
          sessionId,
          data: {
            title: localTitle.trim() ? localTitle : null,
            expected_version: expectedVersion,
          },
        }),
      );
      if (response.status === 200) {
        setTitle(response.data.title ?? "");
        queryClient.setQueryData(
          getGetSessionApiLoopSessionsSessionIdGetQueryKey(sessionId),
          response,
        );
        await queryClient.invalidateQueries({
          queryKey: getListSessionsApiLoopSessionsGetQueryKey(),
        });
        setDirty(false);
      }
    } catch (error) {
      if (!isVersionConflict(error)) {
        return;
      }
      const typedError = operationalError(error);
      try {
        const refreshed = await sessionQuery.refetch();
        if (refreshed.data?.status === 200) {
          setConflict({
            localTitle,
            serverTitle: refreshed.data.data.title ?? "",
            serverVersion: refreshed.data.data.version,
          });
          return;
        }
      } catch {
        // Resolution remains suspended until the Account retries this read.
      }
      setConflict({
        localTitle,
        serverTitle: null,
        serverVersion: typedError?.current_version ?? expectedVersion,
      });
    }
  }

  async function retryConflictLoad() {
    if (!conflict) return;
    try {
      const refreshed = await sessionQuery.refetch();
      if (refreshed.data?.status === 200) {
        setConflict({
          localTitle: conflict.localTitle,
          serverTitle: refreshed.data.data.title ?? "",
          serverVersion: refreshed.data.data.version,
        });
      }
    } catch {
      setStatus("conflict");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || conflict) return;
    await saveTitle(title, session.version);
  }

  async function keepLocalTitle() {
    if (!conflict || conflict.serverTitle === null) return;
    const resolution = conflict;
    setConflict(null);
    queue.resumeAfterConflict();
    await saveTitle(resolution.localTitle, resolution.serverVersion);
  }

  function useServerTitle() {
    if (!conflict || conflict.serverTitle === null) return;
    setTitle(conflict.serverTitle);
    setDirty(false);
    setConflict(null);
    queue.resumeAfterConflict();
    setStatus("saved");
  }

  if (sessionQuery.isLoading) {
    return <p className="text-muted-foreground">Loading Loop Session…</p>;
  }
  if (!session) {
    return (
      <div role="alert" className="rounded-md border border-destructive bg-card p-4">
        <p>We could not load this Loop Session.</p>
        <Button className="mt-3" variant="outline" onClick={() => sessionQuery.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>{title || "Untitled Loop Session"}</CardTitle>
          <CardDescription>Rename this Loop Session without overwriting newer changes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={submit}>
            <label className="grid flex-1 gap-2 text-sm font-medium">
              Loop Session title
              <Input
                disabled={status === "saving" || status === "conflict"}
                maxLength={200}
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setDirty(true);
                }}
              />
            </label>
            <Button
              type="submit"
              disabled={!dirty || status === "saving" || status === "conflict"}
            >
              Save title
            </Button>
          </form>
          {STATUS_LABEL[status] ? (
            <p
              className={`mt-3 text-sm ${status === "failed" ? "text-destructive" : "text-muted-foreground"}`}
              role={status === "failed" ? "alert" : "status"}
            >
              {STATUS_LABEL[status]}
            </p>
          ) : null}
          {status === "failed" && patchTitle.error ? (
            <p className="mt-1 text-sm text-destructive">{getApiErrorMessage(patchTitle.error)}</p>
          ) : null}
        </CardContent>
      </Card>

      {conflict ? (
        <Card className="mt-6 border-pending" role="alert">
          <CardHeader>
            <CardTitle>Title conflict</CardTitle>
            <CardDescription>
              Another request changed this Loop Session. Choose which title to keep.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium">Your title</dt>
                <dd className="mt-1 break-words">{conflict.localTitle || "Untitled Loop Session"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium">Current server title</dt>
                <dd className="mt-1 break-words">
                  {conflict.serverTitle === null
                    ? "Could not load the current server title."
                    : conflict.serverTitle || "Untitled Loop Session"}
                </dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-3">
              {conflict.serverTitle === null ? (
                <Button variant="outline" onClick={retryConflictLoad}>
                  Retry loading server title
                </Button>
              ) : null}
              <Button disabled={conflict.serverTitle === null} onClick={keepLocalTitle}>
                Keep my title
              </Button>
              <Button
                disabled={conflict.serverTitle === null}
                variant="outline"
                onClick={useServerTitle}
              >
                Use server title
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
