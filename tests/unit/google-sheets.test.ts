import { describe, expect, it } from "vitest";

import {
  isValidGoogleSheetUrl,
  parsePublishedSheetTabs,
  sanitizeGoogleSheetUrl,
  toPublishedSheetTabUrl,
} from "@/lib/google-sheets";

describe("google sheet validation", () => {
  it("accepts docs.google.com spreadsheet URLs", () => {
    const url = "https://docs.google.com/spreadsheets/d/abc123/edit?usp=sharing";
    expect(isValidGoogleSheetUrl(url)).toBe(true);
  });

  it("rejects non-sheet URLs", () => {
    const url = "https://example.com/spreadsheets/d/abc123/edit";
    expect(isValidGoogleSheetUrl(url)).toBe(false);
  });

  it("sanitizes invalid URL to null", () => {
    expect(sanitizeGoogleSheetUrl("https://example.com")).toBeNull();
  });

  it("parses tab names and gids from published html", () => {
    const html = [
      'items.push({name: "Program Setup", pageUrl: "...", gid: "2034300308",initialSheet: false});',
      'items.push({name: "W1", pageUrl: "...", gid: "1157471987",initialSheet: true});',
    ].join("");

    expect(parsePublishedSheetTabs(html)).toEqual([
      { name: "Program Setup", gid: "2034300308" },
      { name: "W1", gid: "1157471987" },
    ]);
  });

  it("builds single-sheet publish url for selected gid", () => {
    const publishUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-foo/pubhtml?widget=true&headers=false";
    expect(toPublishedSheetTabUrl(publishUrl, "1157471987", 9)).toBe(
      "https://docs.google.com/spreadsheets/d/e/2PACX-foo/pubhtml/sheet?widget=true&headers=false&gid=1157471987&rm=9",
    );
  });
});
