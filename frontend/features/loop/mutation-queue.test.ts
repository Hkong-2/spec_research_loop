import { describe, expect, it, vi } from "vitest";

import { QueueSuspendedError, SerializedMutationQueue } from "./mutation-queue";

describe("SerializedMutationQueue", () => {
  it("runs mutations one at a time and reports save state", async () => {
    const statuses: string[] = [];
    const releaseFirst = Promise.withResolvers<void>();
    const calls: string[] = [];
    const queue = new SerializedMutationQueue({
      isConflict: () => false,
      onStatus: (status) => statuses.push(status),
    });

    const first = queue.enqueue(async () => {
      calls.push("first:start");
      await releaseFirst.promise;
      calls.push("first:end");
      return 2;
    });
    const second = queue.enqueue(async () => {
      calls.push("second");
      return 3;
    });

    await vi.waitFor(() => expect(calls).toEqual(["first:start"]));
    releaseFirst.resolve();

    await expect(Promise.all([first, second])).resolves.toEqual([2, 3]);
    await queue.flush();
    expect(calls).toEqual(["first:start", "first:end", "second"]);
    expect(statuses).toEqual(["saving", "saved", "saving", "saved"]);
  });

  it("suspends after a conflict until explicit resolution", async () => {
    const conflict = new Error("conflict");
    const releaseConflict = Promise.withResolvers<void>();
    const queue = new SerializedMutationQueue({
      isConflict: (error) => error === conflict,
      onStatus: () => undefined,
    });

    const conflicting = queue.enqueue(async () => {
      await releaseConflict.promise;
      throw conflict;
    });
    const alreadyQueued = queue.enqueue(async () => 2);
    releaseConflict.resolve();

    await expect(conflicting).rejects.toBe(conflict);
    await expect(alreadyQueued).rejects.toBeInstanceOf(QueueSuspendedError);
    await expect(queue.enqueue(async () => 2)).rejects.toBeInstanceOf(QueueSuspendedError);

    queue.resumeAfterConflict();
    await expect(queue.enqueue(async () => 3)).resolves.toBe(3);
  });

  it("reports ordinary failures without suspending later saves", async () => {
    const statuses: string[] = [];
    const queue = new SerializedMutationQueue({
      isConflict: () => false,
      onStatus: (status) => statuses.push(status),
    });

    await expect(
      queue.enqueue(async () => {
        throw new Error("offline");
      }),
    ).rejects.toThrow("offline");
    await expect(queue.enqueue(async () => 4)).resolves.toBe(4);
    expect(statuses).toEqual(["saving", "failed", "saving", "saved"]);
  });
});
