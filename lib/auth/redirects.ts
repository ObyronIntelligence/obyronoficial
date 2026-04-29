const DEFAULT_AUTH_REDIRECT = "/neural";

export function normalizeAuthNextPath(value: string | null | undefined, fallback = DEFAULT_AUTH_REDIRECT) {
  const trimmedValue = value?.trim();

  if (!trimmedValue || !trimmedValue.startsWith("/") || trimmedValue.startsWith("//")) {
    return fallback;
  }

  return trimmedValue;
}

export function toAbsoluteBrowserUrl(path: string) {
  if (typeof window === "undefined") {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}
