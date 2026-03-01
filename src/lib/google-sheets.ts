const GOOGLE_SHEETS_HOSTS = new Set(["docs.google.com"]);

export function isValidGoogleSheetUrl(value: string) {
  try {
    const url = new URL(value);
    return GOOGLE_SHEETS_HOSTS.has(url.hostname) && url.pathname.includes("/spreadsheets/");
  } catch {
    return false;
  }
}

export function sanitizeGoogleSheetUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return isValidGoogleSheetUrl(trimmed) ? trimmed : null;
}
