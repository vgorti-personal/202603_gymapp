import { describe, expect, it } from "vitest";

import { isValidGoogleSheetUrl, sanitizeGoogleSheetUrl } from "@/lib/google-sheets";

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
});
