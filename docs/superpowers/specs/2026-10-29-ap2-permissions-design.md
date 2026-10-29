# AP2 Berechtigungen: Zugriffe prüfen und sicher korrigieren

User approved implementation and normal green merge/publication on2026-10-29 20:07:06, under the adopted autonomous workflow. Ordinary details below are builder choices within that scope.

## Original fictional model

Three workshop employees: Lea belongs to Werkstatt and Disposition; Tom belongs to Werkstatt and Personal; Mira belongs to Personal. Two folders: Aufträge and Personalakten. Werkstatt grants reading Aufträge; Disposition grants editing Aufträge; Personal grants editing Personalakten. All other group/folder pairs grant nothing.

Only positive group grants combine; editing includes reading. No grant means no access. No individual grants, explicit deny, hierarchy/inheritance, admin overrides, platform-specific ACL interpretation or actual commands/settings. This is a supplied teaching model, not a complete Windows/Linux permission system. Duplicate/overlapping grants do not reduce rights. Pure helpers compute set union under these exact rules.

Objective1: six effective-rights choices (no access/read/edit). Expected ordered Lea orders/edit, personnel/none; Tom orders/read, personnel/edit; Mira orders/none, personnel/edit. Evaluate own exact choice strings only, reject missing/inherited/malformed values with associated per-field errors.

Objective2: select one smallest allowed correction and a sufficient planned verification. Business targets: Lea edit Aufträge/no Personalakten; Tom read-only Aufträge/no Personalakten; Mira edit Personalakten/no Aufträge. Only Tom's memberships may change; no new groups/direct grants or changes to group rights/other users. Removing Tom from Personal while retaining Werkstatt is the one-step correction. Other proposed plans either retain the unwanted access, lose needed access, grant excess access or violate scope. Verify normal-user positive AND negative operations on both folders, including regression checks for Lea/Mira, in a planned controlled test using test files. No post-change measurements are supplied; a planned model result is not proof of real success.

Reasoning: self-assess least privilege, approval, expected/actual tests, documentation and rollback. Sound alternative real-world designs welcome in reasoning; no automatic grading of free text. Generic reasoning example must not reveal objective choices/results.

## Integration and safeguards

Dedicated `ap2AccessControl` module, pure `accessControl.ts`, established React trainer/page/progress pattern. Keep all existing module IDs, drills and training-run trio unchanged. Two objective first-completed checks/run max2, including blank/wrong submissions; repeats cannot score. Reveal-before-first-check stays unscored after hiding. Edits clear stale feedback; rubric/examples never score. Guest no persistence; page identity key resets on login/account change with permanent warning. New-run reset clears all session state and guards; reload/leaving loses drafts, aggregate progress remains unchanged. No schema/dependency/backend/security changes or account credentials.

Chosen dedicated trainer reuses established flow. Extending a random command drill would lose the connected business problem; arbitrary ACL editor/simulator would exceed approved scope. Current cost/DNS/recovery run remains exactly as shipped.

README: eight original AP2 scenarios,30modules/29guest; factual session/feature description. Existing changelog: new29/10/2026 permissions entry, only newest Aktuell; preserve prior entries. No unsupported exam frequency/official endorsement/live-persistence claim. No PR58 edits.
