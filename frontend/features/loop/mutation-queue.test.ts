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

  it("debounces scheduled mutations and flushes the latest one immediately", async () => {
    vi.useFakeTimers();
    const calls: string[] = [];
    const queue = new SerializedMutationQueue({
      isConflict: () => false,
      onStatus: () => undefined,
    });

    const first = queue.schedule(async () => {
      calls.push("first");
      return "first";
    }, 400);
    const second = queue.schedule(async () => {
      calls.push("second");
      return "second";
    }, 400);

    await vi.advanceTimersByTimeAsync(399);
    expect(calls).toEqual([]);

    const flushed = queue.flush();
    await expect(Promise.all([first, second, flushed])).resolves.toEqual(["second", "second", undefined]);
    expect(calls).toEqual(["second"]);
    vi.useRealTimers();
  });

  it("propagates a flushed save failure so Confirm can abort", async () => {
    const queue = new SerializedMutationQueue({
      isConflict: () => false,
      onStatus: () => undefined,
    });

    const scheduled = queue.schedule(async () => {
      throw new Error("offline");
    }, 400);
    const flushed = queue.flush();

    await expect(scheduled).rejects.toThrow("offline");
    await expect(flushed).rejects.toThrow("offline");
  });

  it("does not run a scheduled mutation after a conflict until explicit resolution", async () => {
    vi.useFakeTimers();
    const conflict = new Error("conflict");
    const queue = new SerializedMutationQueue({
      isConflict: (error) => error === conflict,
      onStatus: () => undefined,
    });

    await expect(queue.enqueue(async () => {
      throw conflict;
    })).rejects.toBe(conflict);

    const scheduled = queue.schedule(async () => "later", 400);
    await expect(scheduled).rejects.toBeInstanceOf(QueueSuspendedError);
    await vi.advanceTimersByTimeAsync(400);
    await queue.flush();

    queue.resumeAfterConflict();
    const resumed = queue.schedule(async () => "ok", 400);
    await queue.flush();
    await expect(resumed).resolves.toBe("ok");
    vi.useRealTimers();
  });
});
