const DEFAULT_DESTINATION = "/sessions";

export function safeReturnDestination(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\") ||
    /[\u0000-\u001f]/.test(value)
  ) {
    return DEFAULT_DESTINATION;
  }
  return value;
}

export function loginDestination(returnTo: string): string {
  return `/login?returnTo=${encodeURIComponent(safeReturnDestination(returnTo))}`;
}
