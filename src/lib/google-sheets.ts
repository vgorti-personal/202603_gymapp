import type { SheetTab } from "@/lib/types";

const GOOGLE_SHEETS_HOSTS = new Set(["docs.google.com"]);
const SHEET_TAB_PATTERN = /items\.push\(\{name:\s*"((?:\\.|[^"\\])*)",[\s\S]*?gid:\s*"(-?\d+)"/g;

function decodeJsQuotedString(raw: string) {
  try {
    return JSON.parse(`"${raw.replace(/"/g, '\\"')}"`) as string;
  } catch {
    return raw.replace(/\\"/g, '"');
  }
}

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

export function parsePublishedSheetTabs(html: string): SheetTab[] {
  const tabs: SheetTab[] = [];
  for (const match of html.matchAll(SHEET_TAB_PATTERN)) {
    const rawName = match[1];
    const gid = match[2];
    if (!rawName || !gid) {
      continue;
    }
    tabs.push({
      name: decodeJsQuotedString(rawName),
      gid,
    });
  }
  return tabs;
}

export async function fetchPublishedSheetTabs(publishUrl: string): Promise<SheetTab[]> {
  const safeUrl = sanitizeGoogleSheetUrl(publishUrl);
  if (!safeUrl) {
    return [];
  }
  const response = await fetch(safeUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    return [];
  }
  const html = await response.text();
  return parsePublishedSheetTabs(html);
}

export function toPublishedSheetTabUrl(publishUrl: string, gid: string, cacheBust?: number) {
  const safeUrl = sanitizeGoogleSheetUrl(publishUrl);
  if (!safeUrl) {
    return null;
  }

  const url = new URL(safeUrl);
  if (url.pathname.endsWith("/pubhtml")) {
    url.pathname = `${url.pathname}/sheet`;
  } else if (!url.pathname.includes("/pubhtml/sheet")) {
    return safeUrl;
  }

  url.searchParams.set("headers", "false");
  url.searchParams.set("gid", gid);
  if (typeof cacheBust === "number") {
    url.searchParams.set("rm", String(cacheBust));
  }

  return url.toString();
}

export function pickDefaultSheetTab(tabs: SheetTab[]) {
  if (tabs.length === 0) {
    return null;
  }
  const weekly = tabs.find((tab) => /^w\d+/i.test(tab.name.trim()));
  if (weekly) {
    return weekly;
  }
  const nonSetup = tabs.find((tab) => !/setup/i.test(tab.name));
  return nonSetup ?? tabs[0];
}
