"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api/config";
import {
  getGetSessionApiLoopSessionsSessionIdGetQueryKey,
  useCreateCardApiLoopSessionsSessionIdCardsPost,
  useGetSessionApiLoopSessionsSessionIdGet,
  usePatchCardApiLoopSessionsSessionIdCardsCardIdPatch,
} from "@/lib/api/generated/endpoints";
import {
  type CardKind,
  type CardMutationResponse,
  type CardResponse,
  type LoopSessionResponse,
} from "@/lib/api/generated/model";

import { CARD_KIND_LABELS, ownedCardKinds } from "./catalog";
import { useLoopSessionSave } from "./loop-session-save";
import { type SaveStatus } from "./mutation-queue";
import { isVersionConflict, operationalError } from "./operational-error";

const AUTOSAVE_MS = 400;

type Draft = {
  id: string;
  kind: CardKind;
  text: string;
};

type Conflict = {
  cardId: string;
  kind: CardKind | null;
  isCreate: boolean;
  localText: string;
  serverText: string | null;
  serverBody: Record<string, unknown> | null;
  serverVersion: number;
};

type SessionQueryData = {
  status: number;
  data: LoopSessionResponse;
};

function asBody(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

function bodyText(body: Record<string, unknown>): string {
  return typeof body.text === "string" ? body.text : "";
}

function withBodyText(body: Record<string, unknown>, text: string): Record<string, unknown> {
  return { ...body, text };
}

function cardFromMutation(response: CardMutationResponse): CardResponse {
  return {
    id: response.id,
    kind: response.kind,
    body: response.body,
    created_at: response.created_at,
    updated_at: response.updated_at,
  };
}

const STATUS_LABEL: Record<SaveStatus, string | null> = {
  idle: null,
  saving: "Saving…",
  saved: "Saved",
  failed: "Save failed",
  conflict: "Resolve conflict",
};

export function WorkingDraftCardCanvas({ sessionId }: { sessionId: string }) {
  const queryClient = useQueryClient();
  const sessionQuery = useGetSessionApiLoopSessionsSessionIdGet(sessionId);
  const createCard = useCreateCardApiLoopSessionsSessionIdCardsPost();
  const patchCard = usePatchCardApiLoopSessionsSessionIdCardsCardIdPatch();
  const { queue, status, setStatus } = useLoopSessionSave();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;

  const session = sessionQuery.data?.status === 200 ? sessionQuery.data.data : null;
  const kinds = session ? ownedCardKinds(session.working_draft_node) : [];
  const ownedCards = session
    ? session.cards.filter((item) => kinds.includes(item.kind))
    : [];

  useEffect(() => {
    if (!session || conflict) return;
    setTexts((current) => {
      const next = { ...current };
      for (const item of session.cards) {
        if (!dirty[item.id]) {
          next[item.id] = bodyText(asBody(item.body));
        }
      }
      return next;
    });
  }, [conflict, dirty, session]);

  useEffect(() => {
    return () => {
      void queue.flush().catch(() => undefined);
    };
  }, [queue]);

  function applyCardMutation(response: CardMutationResponse) {
    queryClient.setQueryData(
      getGetSessionApiLoopSessionsSessionIdGetQueryKey(sessionId),
      (current: SessionQueryData | undefined) => {
        if (!current || current.status !== 200) return current;
        const nextCard = cardFromMutation(response);
        const cards = current.data.cards.some((item) => item.id === nextCard.id)
          ? current.data.cards.map((item) => (item.id === nextCard.id ? nextCard : item))
          : [...current.data.cards, nextCard];
        return {
          ...current,
          data: { ...current.data, version: response.version, cards },
        };
      },
    );
  }

  async function persistCard(cardId: string, localText: string, expectedVersion: number, baseBody: Record<string, unknown>) {
    const response = await patchCard.mutateAsync({
      sessionId,
      cardId,
      data: {
        expected_version: expectedVersion,
        body: withBodyText(baseBody, localText),
      },
    });
    if (response.status === 200) {
      setTexts((current) => ({ ...current, [cardId]: bodyText(asBody(response.data.body)) }));
      setDirty((current) => ({ ...current, [cardId]: false }));
      applyCardMutation(response.data);
    }
    return response;
  }

  async function persistDraft(draft: Draft, expectedVersion: number) {
    if (!draftsRef.current.some((item) => item.id === draft.id) || !draft.text.trim()) {
      return;
    }
    const response = await createCard.mutateAsync({
      sessionId,
      data: {
        expected_version: expectedVersion,
        kind: draft.kind,
        body: { text: draft.text },
      },
    });
    if (response.status === 201) {
      setDrafts((current) => current.filter((item) => item.id !== draft.id));
      applyCardMutation(response.data);
    }
    return response;
  }

  async function handleSaveError(
    error: unknown,
    cardId: string,
    localText: string,
    expectedVersion: number,
    kind: CardKind | null,
  ) {
    if (!isVersionConflict(error)) {
      return;
    }
    const typedError = operationalError(error);
    try {
      const refreshed = await sessionQuery.refetch();
      if (refreshed.data?.status === 200) {
        const serverCard = refreshed.data.data.cards.find((item) => item.id === cardId);
        const isCreate = !serverCard;
        const serverBody = serverCard ? asBody(serverCard.body) : isCreate ? {} : null;
        setConflict({
          cardId,
          kind,
          isCreate,
          localText,
          serverText: serverCard ? bodyText(asBody(serverCard.body)) : isCreate ? "" : null,
          serverBody,
          serverVersion: refreshed.data.data.version,
        });
        return;
      }
    } catch {
      // Resolution remains suspended until the Account retries this read.
    }
    setConflict({
      cardId,
      kind,
      isCreate: false,
      localText,
      serverText: null,
      serverBody: null,
      serverVersion: typedError?.current_version ?? expectedVersion,
    });
  }

  function scheduleCardSave(item: CardResponse, nextText: string) {
    if (!session || conflict) return;
    const expectedVersion = session.version;
    const baseBody = asBody(item.body);
    void queue
      .schedule(async () => {
        try {
          return await persistCard(item.id, nextText, expectedVersion, baseBody);
        } catch (error) {
          await handleSaveError(error, item.id, nextText, expectedVersion, item.kind);
          throw error;
        }
      }, AUTOSAVE_MS)
      .catch(() => undefined);
  }

  function scheduleDraftSave(draft: Draft, nextText: string) {
    if (!session || conflict || !nextText.trim()) return;
    const expectedVersion = session.version;
    const nextDraft = { ...draft, text: nextText };
    void queue
      .schedule(async () => {
        try {
          return await persistDraft(nextDraft, expectedVersion);
        } catch (error) {
          await handleSaveError(error, draft.id, nextText, expectedVersion, draft.kind);
          throw error;
        }
      }, AUTOSAVE_MS)
      .catch(() => undefined);
  }

  async function retryConflictLoad() {
    if (!conflict) return;
    try {
      const refreshed = await sessionQuery.refetch();
      if (refreshed.data?.status === 200) {
        const serverCard = refreshed.data.data.cards.find((item) => item.id === conflict.cardId);
        const isCreate = !serverCard;
        setConflict({
          ...conflict,
          isCreate,
          serverText: serverCard ? bodyText(asBody(serverCard.body)) : isCreate ? "" : null,
          serverBody: serverCard ? asBody(serverCard.body) : isCreate ? {} : null,
          serverVersion: refreshed.data.data.version,
        });
      }
    } catch {
      setStatus("conflict");
    }
  }

  async function keepLocalCard() {
    if (!conflict || conflict.serverBody === null) return;
    const { cardId, kind, isCreate, localText, serverVersion, serverBody } = conflict;
    setConflict(null);
    queue.resumeAfterConflict();
    try {
      if (isCreate && kind) {
        await queue.enqueue(() => persistDraft({ id: cardId, kind, text: localText }, serverVersion));
      } else {
        await queue.enqueue(() => persistCard(cardId, localText, serverVersion, serverBody));
      }
    } catch (error) {
      await handleSaveError(error, cardId, localText, serverVersion, kind);
    }
  }

  function useServerCard() {
    if (!conflict || conflict.serverBody === null) return;
    if (conflict.isCreate) {
      setDrafts((current) => current.filter((item) => item.id !== conflict.cardId));
    } else {
      setTexts((current) => ({ ...current, [conflict.cardId]: conflict.serverText ?? "" }));
      setDirty((current) => ({ ...current, [conflict.cardId]: false }));
    }
    setConflict(null);
    queue.resumeAfterConflict();
    setStatus("saved");
  }

  if (sessionQuery.isLoading) {
    return <p className="text-muted-foreground">Loading Cards…</p>;
  }
  if (!session) {
    return (
      <div role="alert" className="rounded-md border border-destructive bg-card p-4">
        <p>We could not load Cards for this Working Draft.</p>
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
          <CardTitle>Cards</CardTitle>
          <CardDescription>
            {kinds.length === 0
              ? "This Workflow Node owns no Cards."
              : "Every Card kind is repeatable. Unknown fields are preserved."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {kinds.map((kind) => {
            const label = CARD_KIND_LABELS[kind];
            const kindCards = ownedCards.filter((item) => item.kind === kind);
            const kindDrafts = drafts.filter((item) => item.kind === kind);
            return (
              <section key={kind} aria-label={`${label} Cards`} className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-medium">{label}</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={status === "conflict"}
                    onClick={() =>
                      setDrafts((current) => [
                        ...current,
                        { id: crypto.randomUUID(), kind, text: "" },
                      ])
                    }
                  >
                    Add {label}
                  </Button>
                </div>
                {kindCards.map((item) => (
                  <label key={item.id} className="grid gap-2 text-sm font-medium">
                    {label} Card
                    <Textarea
                      disabled={status === "conflict"}
                      value={texts[item.id] ?? bodyText(asBody(item.body))}
                      onChange={(event) => {
                        const nextText = event.target.value;
                        setTexts((current) => ({ ...current, [item.id]: nextText }));
                        setDirty((current) => ({ ...current, [item.id]: true }));
                        scheduleCardSave(item, nextText);
                      }}
                    />
                  </label>
                ))}
                {kindDrafts.map((draft) => (
                  <div key={draft.id} className="grid gap-2">
                    <label className="grid gap-2 text-sm font-medium">
                      New {label} Card
                      <Textarea
                        disabled={status === "conflict"}
                        value={draft.text}
                        onChange={(event) => {
                          const nextText = event.target.value;
                          setDrafts((current) =>
                            current.map((item) =>
                              item.id === draft.id ? { ...item, text: nextText } : item,
                            ),
                          );
                          scheduleDraftSave(draft, nextText);
                        }}
                      />
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="justify-self-start"
                      onClick={() =>
                        setDrafts((current) => current.filter((item) => item.id !== draft.id))
                      }
                    >
                      Cancel new {label} Card
                    </Button>
                  </div>
                ))}
              </section>
            );
          })}
          {STATUS_LABEL[status] ? (
            <p
              className={`text-sm ${status === "failed" ? "text-destructive" : "text-muted-foreground"}`}
              role={status === "failed" ? "alert" : "status"}
            >
              {STATUS_LABEL[status]}
            </p>
          ) : null}
          {status === "failed" && (patchCard.error || createCard.error) ? (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(patchCard.error ?? createCard.error)}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {conflict ? (
        <Card className="mt-6 border-pending" role="alert">
          <CardHeader>
            <CardTitle>Card conflict</CardTitle>
            <CardDescription>
              Another request changed this Loop Session. Choose which Card text to keep.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium">Your Card</dt>
                <dd className="mt-1 whitespace-pre-wrap break-words">{conflict.localText || "Empty"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium">Current server Card</dt>
                <dd className="mt-1 whitespace-pre-wrap break-words">
                  {conflict.serverBody === null
                    ? "Could not load the current server Card."
                    : conflict.serverText || "Empty"}
                </dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-3">
              {conflict.serverBody === null ? (
                <Button variant="outline" onClick={retryConflictLoad}>
                  Retry loading server Card
                </Button>
              ) : null}
              <Button disabled={conflict.serverBody === null} onClick={keepLocalCard}>
                Keep my Card
              </Button>
              <Button disabled={conflict.serverBody === null} variant="outline" onClick={useServerCard}>
                Use server Card
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
