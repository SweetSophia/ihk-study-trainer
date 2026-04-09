import { describe, expect, it } from "vitest";

import {
  normalizeProgressModules,
  toCanonicalModuleId,
  toStoredProgressModuleId,
} from "../moduleIds";

describe("module ID compatibility helpers", () => {
  it("maps legacy module IDs to canonical UI IDs", () => {
    expect(toCanonicalModuleId("image-calc")).toBe("imageCalc");
    expect(toCanonicalModuleId("unit-conversion")).toBe("unitConversion");
    expect(toCanonicalModuleId("image-transfer-combo")).toBe(
      "imageTransferCombo",
    );
    expect(toCanonicalModuleId("handelskalkulation-vorwaerts")).toBe(
      "handelskalkulationVorwaerts",
    );
    expect(toCanonicalModuleId("handelskalkulation-rueckwaerts")).toBe(
      "handelskalkulationRueckwaerts",
    );
    expect(toCanonicalModuleId("handelskalkulation")).toBe("handelskalkulation");
  });

  it("maps canonical IDs back to stored progress IDs for backward compatibility", () => {
    expect(toStoredProgressModuleId("imageCalc")).toBe("image-calc");
    expect(toStoredProgressModuleId("unitConversion")).toBe("unit-conversion");
    expect(toStoredProgressModuleId("imageTransferCombo")).toBe(
      "image-transfer-combo",
    );
    expect(toStoredProgressModuleId("handelskalkulationVorwaerts")).toBe(
      "handelskalkulation-vorwaerts",
    );
    expect(toStoredProgressModuleId("handelskalkulationRueckwaerts")).toBe(
      "handelskalkulation-rueckwaerts",
    );
  });

  it("merges legacy and canonical progress rows into one canonical module entry", () => {
    const normalized = normalizeProgressModules([
      {
        module: "image-calc",
        questions_attempted: 3,
        questions_correct: 2,
        streak_days: 1,
        last_session: "2026-04-01T08:00:00.000Z",
      },
      {
        module: "imageCalc",
        questions_attempted: 4,
        questions_correct: 3,
        streak_days: 2,
        last_session: "2026-04-02T08:00:00.000Z",
      },
    ]);

    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toMatchObject({
      module: "imageCalc",
      questions_attempted: 7,
      questions_correct: 5,
      streak_days: 2,
      last_session: "2026-04-02T08:00:00.000Z",
    });
  });

  it("merges legacy and canonical Handelskalkulation split IDs", () => {
    const normalized = normalizeProgressModules([
      {
        module: "handelskalkulation-vorwaerts",
        questions_attempted: 1,
        questions_correct: 1,
        streak_days: 1,
        last_session: "2026-04-01T08:00:00.000Z",
      },
      {
        module: "handelskalkulationVorwaerts",
        questions_attempted: 2,
        questions_correct: 1,
        streak_days: 3,
        last_session: "2026-04-02T08:00:00.000Z",
      },
    ]);

    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toMatchObject({
      module: "handelskalkulationVorwaerts",
      questions_attempted: 3,
      questions_correct: 2,
      streak_days: 3,
      last_session: "2026-04-02T08:00:00.000Z",
    });
  });

  it("keeps legacy combined handelskalkulation progress unchanged", () => {
    const normalized = normalizeProgressModules([
      {
        module: "handelskalkulation",
        questions_attempted: 5,
        questions_correct: 4,
        streak_days: 2,
        last_session: "2026-04-03T08:00:00.000Z",
      },
    ]);

    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toMatchObject({
      module: "handelskalkulation",
      questions_attempted: 5,
      questions_correct: 4,
      streak_days: 2,
      last_session: "2026-04-03T08:00:00.000Z",
    });
  });
});
