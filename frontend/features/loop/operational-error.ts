import { ApiError } from "@/lib/api/config";
import type { OperationalError } from "@/lib/api/generated/model";

export function operationalError(error: unknown): OperationalError | null {
  if (!(error instanceof ApiError) || typeof error.data !== "object" || error.data === null) {
    return null;
  }
  if (!("code" in error.data) || typeof error.data.code !== "string") {
    return null;
  }
  return error.data as OperationalError;
}

export function isVersionConflict(error: unknown): boolean {
  return operationalError(error)?.code === "version_conflict";
}
