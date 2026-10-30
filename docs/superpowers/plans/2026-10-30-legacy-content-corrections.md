# Legacy Content Corrections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Correct verified legacy answers and explanatory content without changing task identity or broadening pedagogy.

**Architecture:** Preserve generator interfaces and existing grading. Update source bank entries and treat RAID 5/6 tiles explicitly as capacity accounting. Use existing Vitest and Testing Library boundaries.

**Tech Stack:** TypeScript, React, Vitest, Testing Library; no dependency changes.

**Spec:** `docs/superpowers/specs/2026-10-30-legacy-content-corrections-design.md`

## Global Constraints

No new task variants, module IDs, schema, dependencies, security/configuration/accounts/AP2/progress or 5% tolerance changes. No external writes, push, PR, comments, merge, full suite or build in this delegated task. Leave changes uncommitted for parent review. Shared StudyCard/registry/validation are outside this ownership.

## Review Focus

- OSI mnemonic direction must agree with the English layer initials, rather than just mention seven layers.
- Private-subnet outbound NAT must remain possible while direct Internet Gateway routing distinguishes the answer.
- RAID 5/6 screen-reader labels and visible labels must both describe capacity units; counts remain one/two parity units.
- Linux must reject framework names and unrelated format commands while retaining valid alternatives and input normalization.
- Fiber examples must bind each rate/reach pair to an optic and grade; helper/grading redesign stays deferred.

### Task 1: OSI and cloud generated content

**Files:** `src/app/lib/generators/{osi,cloud}.ts`, corresponding `__tests__/*.test.ts`.
**Interfaces:** Existing `generateOsiOrderQuestion()` and `generateCloudQuestion()` outputs only; no signature changes.

- [x] Add mnemonic-initial/direction and generated AWS direct-route/NAT regression cases.
- [x] Run focused files; confirm RED for reversed mnemonic and inaccurate selected answer.
- [x] Swap mnemonic labels and replace cloud option/key/explanation consistently.
- [x] Run focused files; confirm GREEN.

### Task 2: Linux command grading and explanations

**Files:** `src/app/lib/generators/linux.ts`, `src/app/lib/generators/__tests__/linux.test.ts`.
**Interfaces:** Existing `generateLinuxQuestion()` and production `validateStructuredAnswer()`.

- [x] Update old expectations that incorrectly accept `nftables`; add cases accepting `nft` and `mkfs.ext4` but rejecting `nftables`, `fdisk`, and arbitrary mkfs prefixes/arguments. Add solution-output checks for byte/character flags and listening-only examples.
- [x] Run Linux suite; confirm expected factual RED failures.
- [x] Correct bank aliases/explanations only.
- [x] Run Linux suite; confirm GREEN with existing valid alternatives preserved.

### Task 3: RAID capacity accounting

**Files:** `src/app/components/RaidVisualizer.tsx`, component tests, `src/app/lib/generators/raid.ts` and its tests.
**Interfaces:** Keep `classifyDisks(raid: RaidConfig): ClassifiedDisk[]`; clarify that parity roles on RAID 5/6 are capacity units only. Preserve `RaidConfig`.

- [x] Add parameterized rendered RAID 5/6 regressions for capacity labels, distributed parity, one/two unit overhead, and no physical parity-disk label. Correct old expectations that froze physical roles.
- [x] Add generated solution checks for distributed parity and recoverability of any one failed disk.
- [x] Run component/generator suites; confirm RED.
- [x] Relabel parity-level grid/tiles/legend/stat/ARIA; add concise visible accounting explanation; correct generator wording.
- [x] Run suites; confirm GREEN, preserving capacity and fault-tolerance tests.

### Task 4: Fiber comparison qualification

**Files:** `src/app/lib/generators/cables.ts`, corresponding tests.
**Interfaces:** Existing `generateCableQuestion()` solution output; keep selection and grading unchanged.

- [x] Add comparison regression for 100GBASE-SR4-S 70m OM3/100m OM4 and 100GBASE-LR4-S 10km singlemode examples; prohibit unqualified combined maxima in fiber comparison rows.
- [x] Run cable suite; confirm RED.
- [x] Replace only fiber comparison output with source-backed examples and qualification.
- [x] Run cable suite; confirm GREEN.

### Task 5: Handoff

- [x] Run six focused files together with `node node_modules/vitest/vitest.mjs run src/app/lib/generators/__tests__/{osi,cloud,linux,raid,cables}.test.ts src/app/components/__tests__/RaidVisualizer.test.tsx --maxWorkers=1` (six files: five generators plus component).
- [x] Check `git diff --check` and review touched scope; attach RED/GREEN evidence and source/deferral record.
- [x] Leave uncommitted; parent performs independent review, full suite/build and any authorized integration.


## Execution ledger — 2026-10-30

Base: `3868890713be1a3fd80d557fbb2a2050a3b19c86`; worktree branch: `fix/legacy-content-corrections`.
Pre-flight: no shared interfaces between these correction tasks; existing generator output contracts remain intact.

Ruling: use the pre-existing isolated worktree and leave changes uncommitted — parent owns review/integration and explicitly requested this handoff. No skill-driven commit, merge, full-suite, build or further agent dispatch was performed.

Ruling: preserve RAID tile allocation as a capacity calculation, with all parity-level visible and accessible labels saying capacity units — explicitly authorized minimal correction avoids a stripe-rendering redesign; it does not visualize physical parity placement.

Ruling: K9 changes comparison output only — source-backed optic examples repair the reachable display claim, while latent helper behavior and K4 grading need a later pedagogical decision.

- RED: six targeted files reported **18 failed / 70 passed**, including semantic/content failures for every correction except the mkfs test (an earlier assertion in the broad-alternative loop stopped that case). Full log: `/workspace/legacy-audit/content-red.log`.
- RED, independently isolated mkfs case before retaining its alias: **1 failed / 6 skipped**; production validation rejected `mkfs.ext4`. Full log: `/workspace/legacy-audit/content-mkfs-red.log`.
- GREEN: `node node_modules/vitest/vitest.mjs run src/app/lib/generators/__tests__/{osi,cloud,linux,raid,cables}.test.ts src/app/components/__tests__/RaidVisualizer.test.tsx --maxWorkers=1` → **6 files, 89 tests passed, exit 0**. Full log: `/workspace/legacy-audit/content-green.log`.
- Existing factual expectations changed deliberately: `nftables` command acceptance removed; RAID 5/6 tile/ARIA/legend tests now describe capacity equivalents instead of dedicated physical parity disks. Formula/count/fault-tolerance coverage retained.
- Local self-review: diff restricted to five generators, their tests, RAID visualizer/tests and this source-backed spec/plan. `git diff --check` passed. Independent review and full suite/build remain parent-owned handoff stages.
- Local test runner uses the authorized ignored symlink `node_modules -> /workspace/ihk-legacy-sql-numeric/node_modules`; no manifest/lockfile change.

## Final standalone verification
Root full suite1023/1023 in61files passed219.92s; full lint, explicit types and production build passed. Same installed dependencies were copied locally for the production build; no versions/configuration changed. Independent actual-code review found no blocker and checked15 extra registry/validator assertions plus primary documentation.

Production Chromium1440/390 on this content-only base passed11 scenarios per width: OSI mnemonics, cloud routing/NAT, nft acceptance/nftables rejection, mkfs.ext4, wc, ss/netstat, RAID5/6 capacity accounting and fibre examples. The initial RAID heading assertion used case-sensitive innerText, which reflects CSS uppercase. A DOM/computed-style probe confirmed this diagnostic-only mismatch; affected RAID cases passed4/4 after correcting the selector. Other18 cases passed initially. Keyboard disclosure/content visibility, formulas, layout, page/console errors and absence of account/progress/network writes were checked. OSI drag reordering, hosted QA, live/cloud persistence and physical screenreader coverage remain unverified. This branch does not include the separately pending input/ARIA repair or any changes from72/73/74. No merge is permitted during the pause.
