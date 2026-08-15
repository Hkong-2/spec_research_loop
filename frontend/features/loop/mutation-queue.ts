export type SaveStatus = "idle" | "saving" | "saved" | "failed" | "conflict";

export class QueueSuspendedError extends Error {
  constructor() {
    super("Resolve the version conflict before saving again");
    this.name = "QueueSuspendedError";
  }
}

type QueueOptions = {
  isConflict: (error: unknown) => boolean;
  onStatus: (status: SaveStatus) => void;
};

type ScheduledMutation = {
  mutation: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
};

export class SerializedMutationQueue {
  private tail: Promise<void> = Promise.resolve();
  private suspended = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pending: ScheduledMutation | null = null;

  constructor(private readonly options: QueueOptions) {}

  enqueue<T>(mutation: () => Promise<T>): Promise<T> {
    if (this.suspended) {
      return Promise.reject(new QueueSuspendedError());
    }

    const result = this.tail.then(async () => {
      if (this.suspended) {
        throw new QueueSuspendedError();
      }
      this.options.onStatus("saving");
      try {
        const value = await mutation();
        this.options.onStatus("saved");
        return value;
      } catch (error) {
        if (this.options.isConflict(error)) {
          this.suspended = true;
          this.options.onStatus("conflict");
        } else {
          this.options.onStatus("failed");
        }
        throw error;
      }
    });
    this.tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  schedule<T>(mutation: () => Promise<T>, delayMs: number): Promise<T> {
    if (this.suspended) {
      return Promise.reject(new QueueSuspendedError());
    }
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    return new Promise<T>((resolve, reject) => {
      const previous = this.pending;
      this.pending = {
        mutation,
        resolve: (value) => {
          previous?.resolve(value);
          resolve(value as T);
        },
        reject: (error) => {
          previous?.reject(error);
          reject(error);
        },
      };
      this.timer = setTimeout(() => {
        void this.flushScheduled();
      }, delayMs);
    });
  }

  async flush(): Promise<void> {
    await this.flushScheduled();
    await this.tail;
  }

  private async flushScheduled(): Promise<void> {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const pending = this.pending;
    this.pending = null;
    if (!pending) {
      return;
    }
    try {
      pending.resolve(await this.enqueue(pending.mutation));
    } catch (error) {
      pending.reject(error);
    }
  }

  resumeAfterConflict(): void {
    this.suspended = false;
  }
}
