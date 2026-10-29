# SQL Numeric Equivalence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Native implementation, independent review before each push.

**Goal:** Fix SQL-2 by comparing equivalent scalar numeric results without precision loss or text coercion.
**Architecture:** Field-OID-aware value signatures plus exact decimal normalization inside existing result signatures.
**Tech Stack:** TypeScript, existing PGlite, Vitest.
**Spec:** docs/superpowers/specs/2026-10-29-sql-numeric-equivalence-design.md

## Global Constraints
No dependencies/schema/UI/worker/new-family changes. Keep module/progress IDs, AP2, order/multiplicity/alias and mutation semantics. Independent current-main branch; do not bundle PR72 or PR73. No merges while parent clarification is pending. ReadyPR and real15-minute review after initial/everypush.

## Review Focus
- Numeric strings never go through Number, preserving adjacent large integers/deep fractions.
- Actual text/JSON values must not impersonate normalized numeric values.
- NULL/NaN/infinities and signed zero keep explicit semantics.
- Column reordering, ordered/unordered rows and duplicates remain enforced.
- Legacy and strict/AP2 callers share the same result comparison; mutation snapshot safeguards remain intact.

### Task1: Exact typed numeric signatures
- [x] Add real PGlite regressions for equality/precision/type separation and both caller modes; observe RED.
- [x] Implement minimal numeric normalization and typed row encoding; focused GREEN.
- [x] Full suite/lint/types/build and relevant guest browser worker flows; independent source review.
- [ ] Commit/review-ack/push ReadyPR if eligible, observe real15minutes and all feedback; merge remains paused until clarified.

## Verification ledger

- RED: two numeric equivalence failures across default/strict callers; separate actual AP2 numeric aggregate failed. GREEN:8new focused tests passed across2files (existing32skipped only in that targeted run).
- Final full suite1019/1019 in61files passed195.91s; lint, explicit types and production build passed. Real production Chromium at1440×900 and390×900 passed actualWASM-worker ordered numeric casts, numeric aggregate, mutation, repeat and guest/no-write flows on both fixtures. No accounts/live services used.
- Independent actual-source review found no blocker; direct checks covered exponent forms/domain/array metadata and high precision. Optional permanent exponent-string regression (1e-7/1e21) is deferred; current1e-3case formats as0.001 inJS and direct independent exponent checks passed. No source changes after final verification.
