# AP2-Trainingslauf: IT-Service betreiben

Approved scope: one curated run of three existing original AP2 scenarios; session-only navigation and a combined objective summary separated from reasoning. Implementation choices below are delegated to the builder by the adopted autonomous workflow.

## Design

Use Wirtschaftlichkeit → Fehlersuche → Datensicherung: compare a service's cost assumptions, diagnose an incident, then assess recovery. These remain three independent fictional exercises with their own supplied evidence, not one shared factual incident or an exam simulation. Six existing objective sections; no timer, new questions, interpreter, backend, schema, dependencies or official exam equivalence.

Keep each existing trainer mounted behind a native `hidden` panel, so answers, current feedback, first-attempt guards, reveal history, written reasoning and rubric ticks survive intra-run navigation. Unmounting/recreating trainers on each step would lose those protections; lifting every answer into a new model would duplicate trainer state. Add a small optional typed event contract to the three trainers for checks, edits and reveals. Their existing callbacks remain the only progress-writing path. Embedded reset controls are replaced by one explicit whole-run reset with confirmation; standalone behavior remains unchanged.

The summary records each section's immutable first check (correct/incorrect and whether a solution was already revealed), separately from its latest check. Edits clear only latest feedback. Reveal-before-first-check remains unscored even after hiding/navigating; later correction never rewrites the first result or creates another progress attempt. Guest results are visible locally but never persisted. Show checked/unchecked/unscored counts rather than inventing an exam percentage; report eligible first-check successes with a clear denominator. Self-assessment is never automatically graded or added to these totals. Targeted return buttons reopen the retained weak/unattempted scenario for practice without resetting its scoring guards.

The wrapper has module ID `ap2TrainingRun` for navigation only. Attempts are stored under the original scenario IDs; there is no wrapper progress row or summary write. Parent identity key remounts the complete run on login/account change; logout leaves it as today. Explicit notice: intra-run answers survive, but reload, leaving this module and identity transitions lose session drafts. A manual restart also discards session state; completed aggregate progress is unaffected. No durable draft or cross-device guarantee.

## Acceptance / limits

Accessible ordinary navigation buttons with current-step indication, named panels, keyboard activation and focus moved to the newly selected panel heading. Hidden panels contribute no focusable or announced content. End summary is accessible at any time and identifies incomplete sections rather than implying completion. No live credentials are needed. Hosted cloud persistence is not proven by local tests. PR58 stays held. Stop at reviewed ready-to-merge PR; this package has no merge/deployment authority.
