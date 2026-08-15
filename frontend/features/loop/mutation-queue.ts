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

export class SerializedMutationQueue {
  private tail: Promise<void> = Promise.resolve();
  private suspended = false;

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

  async flush(): Promise<void> {
    await this.tail;
  }

  resumeAfterConflict(): void {
    this.suspended = false;
  }
}
