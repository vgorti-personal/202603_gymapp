import { describe, expect, it } from "vitest";

import { filterTemplates, WORKOUT_TEMPLATES } from "@/lib/workout-templates";

describe("workout templates", () => {
  it("ships curated template count", () => {
    expect(WORKOUT_TEMPLATES.length).toBeGreaterThanOrEqual(12);
    expect(WORKOUT_TEMPLATES.length).toBeLessThanOrEqual(20);
  });

  it("filters by goal and split", () => {
    const templates = filterTemplates("strength", "five_by_five");
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.every((template) => template.goal === "strength")).toBe(true);
    expect(templates.every((template) => template.split === "five_by_five")).toBe(true);
  });

  it("only uses home gym equipment categories", () => {
    const allowed = new Set(["barbell", "dumbbell", "cable", "bodyweight"]);
    for (const template of WORKOUT_TEMPLATES) {
      for (const day of template.days) {
        for (const exercise of day.exercises) {
          expect(allowed.has(exercise.equipment)).toBe(true);
        }
      }
    }
  });
});
