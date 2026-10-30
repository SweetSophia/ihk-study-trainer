# Separate commerce calculation drills — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expose exactly three pure calculation choices while keeping mixed historical progress intact.
**Architecture:** New differential question adapter; replace one active registry entry; separate legacy label and active-only mistake routing. Reuse arithmetic/validators/storage APIs.
**Tech Stack:** TypeScript, React/Next, Vitest, Playwright.
**Spec:** docs/superpowers/specs/2026-10-30-calculation-separation-design.md

## Global Constraints
Forward/backward stable IDs and aliases unchanged. New ID handelskalkulationDifferenz. Old mixed history never remapped/deleted. No schema/dependency/AP2/scoring changes. No merge or separate public review-summary comment.

## Review Focus
- Former RNG branches must never select a different mode for a dedicated entry.
- Legacy history with the most errors must not hide a current practice target.
- Legacy-only history must remain visible without enabling a dead practice action.
- New differential writes must not modify stored forward/backward/mixed counters.
- Repeated checks/reveal must retain existing StudyCard scoring behavior.

## Task1: Separate selection and preserve history
Files: generators/handelskalkulation.ts, generators/registry.ts, modules.ts, page.tsx, ProgressDashboard.tsx and corresponding tests; README.md.
- [x] RED: registry tests for all three mode/namespace contracts across old RNG branch boundaries; differential32fields and current real validator; selector excludes mixed, dashboard labels/counts legacy separately, identity normalization/persistence separate, Home skips retired mistake target.
- [x] Observe failures against current code, not test wiring errors.
- [x] Minimal adapter/registry/metadata/routing edits; no arithmetic or parser edits.
- [x] GREEN focused tests, then full suite/lint/types/build and desktop/narrow Chromium with synthetic local data only.
- [x] Independent actual-code review and fix validated issues before local commit/push.
- [ ] Ready PR, record exact head/publication time/preview, real15-minute window; inspect every review collection, independently replace unavailable reviewers.
- [ ] Prepare exact bilingual summary and stop at ready-to-merge without posting it or merging.

Baseline: fresh main83c474b matches the1121-test integration tree; no duplicate baseline full suite. Native execution authorized by autonomous workflow, no routine design gate. No shared task interfaces.


## Verified local outcome (2026-10-30, before publication)
124 focused tests/9files and1138full tests/65files passed. Lint/types/production build passed. The initial Turbopack build rejected the task-local dependency symlink; using a local copy of the unchanged dependencies resolved it without a config/package change. Chromium1440/390 passed all three modes with independent cent answers, keyboard/repeat/reveal checks. A synthetic real-component dashboard harness checked separate legacy/new history, totals and disabled legacy-only practice. No actual accounts, cloud persistence, physical mobile keyboards or hosted browser access were exercised. Independent actual-code review found no substantive findings. PR review/publication stages remain pending below; no merge/public assessment-comment authority.
