"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import { SerializedMutationQueue, type SaveStatus } from "./mutation-queue";
import { isVersionConflict } from "./operational-error";

type LoopSessionSave = {
  queue: SerializedMutationQueue;
  status: SaveStatus;
  setStatus: (status: SaveStatus) => void;
};

const LoopSessionSaveContext = createContext<LoopSessionSave | null>(null);

export function LoopSessionSaveProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [queue] = useState(
    () =>
      new SerializedMutationQueue({
        isConflict: isVersionConflict,
        onStatus: setStatus,
      }),
  );
  return (
    <LoopSessionSaveContext.Provider value={{ queue, status, setStatus }}>
      {children}
    </LoopSessionSaveContext.Provider>
  );
}

export function useLoopSessionSave(): LoopSessionSave {
  const shared = useContext(LoopSessionSaveContext);
  if (!shared) {
    throw new Error("Loop Session saves require LoopSessionSaveProvider");
  }
  return shared;
}
