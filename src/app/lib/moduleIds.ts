const LEGACY_TO_CANONICAL_MODULE_ID: Record<string, string> = {
  "image-calc": "imageCalc",
  "unit-conversion": "unitConversion",
  "image-transfer-combo": "imageTransferCombo",
  "handelskalkulation-vorwaerts": "handelskalkulationVorwaerts",
  "handelskalkulation-rueckwaerts": "handelskalkulationRueckwaerts",
};

const CANONICAL_TO_STORED_MODULE_ID: Record<string, string> = {
  imageCalc: "image-calc",
  unitConversion: "unit-conversion",
  imageTransferCombo: "image-transfer-combo",
  handelskalkulationVorwaerts: "handelskalkulation-vorwaerts",
  handelskalkulationRueckwaerts: "handelskalkulation-rueckwaerts",
};

export interface ProgressLike {
  module: string;
  questions_attempted: number;
  questions_correct: number;
  streak_days?: number | null;
  last_session?: string | null;
}

export function toCanonicalModuleId(moduleId: string): string {
  return LEGACY_TO_CANONICAL_MODULE_ID[moduleId] ?? moduleId;
}

export function toStoredProgressModuleId(moduleId: string): string {
  return CANONICAL_TO_STORED_MODULE_ID[moduleId] ?? moduleId;
}

export function normalizeProgressModules<T extends ProgressLike>(
  rows: T[],
): T[] {
  const merged = new Map<string, T>();

  for (const row of rows) {
    const canonicalModule = toCanonicalModuleId(row.module);
    const existing = merged.get(canonicalModule);

    if (!existing) {
      merged.set(canonicalModule, {
        ...row,
        module: canonicalModule,
      });
      continue;
    }

    existing.questions_attempted += row.questions_attempted;
    existing.questions_correct += row.questions_correct;

    if (typeof row.streak_days === "number") {
      existing.streak_days = Math.max(
        existing.streak_days ?? 0,
        row.streak_days,
      );
    }

    if (row.last_session) {
      const rowTimestamp = Date.parse(row.last_session);
      const existingTimestamp = existing.last_session
        ? Date.parse(existing.last_session)
        : Number.NEGATIVE_INFINITY;

      if (
        !Number.isNaN(rowTimestamp) &&
        (Number.isNaN(existingTimestamp) || rowTimestamp > existingTimestamp)
      ) {
        existing.last_session = row.last_session;
      }
    }
  }

  return Array.from(merged.values());
}
