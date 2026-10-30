# Legacy Input Contracts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Native implementation; independent actual-code review before every push.

**Goal:** Repair complete-number validation, target-only conversions, readable aggregation and associated controls.
**Architecture:** Keep existing validation/generator/registry/StudyCard contracts; add only an optional text input type for the existing structured renderer.
**Tech Stack:** TypeScript, React, Vitest, existing Next.js.
**Spec:** docs/superpowers/specs/2026-10-30-legacy-input-contracts-design.md

## Global Constraints
Preserve5% tolerance, historical scoring/reveal behavior, moduleIDs/progress/AP2. Direct main3868890 base excludes72/73/74. No merges or denied comment retries. ReadyPR with actual15-minute window after initial/everypush; public assessment prepared locally under current restriction.

## Review Focus
- Entire finite syntax across comma/point/sign/exponents, including negative differences and overflow.
- Radix width/prefix/case and exact integer/IP policies remain unchanged.
- Three adjacent /24 blocks deliberately produce a covering /22, not exact-set equivalence.
- Multiple StudyCards have distinct associated IDs; labels, selectors and disclosure work by keyboard.
- Existing reveal/check/next and Linux/drag-order scoring behavior stays unchanged.

### Task1: Validate numeric and generator contracts
- [x] Add strict-parser and actual unit-conversion suffix regressions; four conversion-direction target-only tests and aggregation contract/Ja/Nein/IPv4 tests. Observe RED.
- [x] Minimal parser, binary/hex generator and aggregation registry changes. Observe GREEN.

### Task2: Accessible rendering
- [x] Add actual label/disclosure/boolean and aggregation-form integration regressions. Observe RED.
- [x] Stable useId associations, optional text input, connected solution target and visible boolean values. Observe GREEN.

### Task3: Final verification/publication
- [x] Full tests, lint, types, production build and desktop/mobile keyboard flows; independent actual-code review before commit/push.
- [ ] ReadyPR, exact remote head/preview and actual15-minute review window. Validate findings; prepare assessment without retrying denied publication. No merge.

## Verification ledger
Initial RED exposed17 expected assertion failures plus a mistaken structured-input test fixture. After correcting that fixture to the actual generic unit-conversion contract, its suffix regression separately failed because the original parser accepted the malformed answer. Focused GREEN347/347 in6files; final full suite1039/1039 in62files passed197.48s. Lint and explicit types passed. Independent actual-code review found no blocker and passed2138 additional assertions, including300 conversion and500 independently calculated covering-supernet samples. Build/browser verification follows before publication; no hosted account acceptance is implied.

Production build passed using a local copy of the unchanged installed dependencies. Production Chromium1440/390 passed four conversion directions with a single target, native label focus, keyboard checking, both disclosure states, aggregation Ja/Nein with independently computed covering prefixes, visible boolean solutions, malformed conversion suffix rejection and no horizontal overflow/page errors/account-progress writes. The first diagnostic matched a target word inside the prompt instead of its leading source phrase; correcting that test selector required no product change. Live/cloud/hosted-browser and physical-screenreader acceptance remain outside this verification.
