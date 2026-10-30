# Separate commerce calculation drills

Approved scope: three selectable offerings, forward, backward and differential; retire the mixed offering from normal selection without deleting or reclassifying history.

Use existing `handelskalkulationVorwaerts` and `handelskalkulationRueckwaerts` IDs and storage aliases unchanged. Add `handelskalkulationDifferenz` for dedicated differential questions, stored under that same new ID (no migration). Reuse the existing corrected differential arithmetic and 32 answer fields, without random mode selection or a forward fallback.

Replace the mixed selector entry with the differential entry. Keep old `handelskalkulation` progress separate, visible as “Kalkulation (gemischter Altbestand)” and included in historical totals. Explain it is retained history and is not part of the new differential score. Exclude retired mixed history from the “Fehler üben” target selection; disable that action when no active module has mistakes. Do not reinterpret its records.

Approach: add one narrow generator adapter and explicit legacy display metadata, retaining current validation, forward/backward adapters and ID normalization. Reusing the mixed ID for differential was rejected because it mislabels historical results. Adding a fourth selectable mixed offering would contradict the approved separation. No dependency/schema changes; AP2 flows, arithmetic and 5% scoring tolerance stay unchanged. Existing mixed generator remains an internal compatibility export, not an active registry entry.

Verification: red-first actual registry/mode tests at old random boundaries; normalization and local synthetic persistence separation; selector/dashboard and Home mistake-routing tests; full suite, lint/types/build; local production Chromium desktop/narrow keyboard/generation/reveal/history flows. No live accounts or hosted access retries. Independent review before every push, Ready PR and actual15-minute review window per push. Stop before merge and before separate review-summary posting.

