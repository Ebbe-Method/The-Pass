# The Pass spec 1 — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (or executing-plans) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Public zero-login demo kiosk at `/` plus `/design` plus fixture OG.

**Architecture:** Vite + React + TypeScript + Tailwind v4. Fixture JSON only. Domain functions (`progress`, `freshness`, `present`) are tested first. UI is fixture-driven.

## Task 1: Domain — progress events

Write `src/lib/progress.test.ts` (failing), then `src/lib/progress.ts`.
Commit: `feat: classify GitHub progress events`

## Task 2: Domain — freshness and heat

Write `src/lib/freshness.test.ts`, then `src/lib/freshness.ts`.
Commit: `feat: size-aware stale and waiting heat`

## Task 3: Presenter — magic tear

Write `src/lib/present.test.ts`, then `src/lib/present.ts`.
Commit: `feat: delayed ticket arrival for magic moment`

## Task 4: Kiosk UI

Vite app, tickets, rails, clocks, chips, empty pass, design gallery.
Commit: `feat: public demo kiosk and design gallery`

## Task 5: Shotgun + OG

Three HTML compositions, fixture OG SVG, silent loop note.
Commit: `feat: shotgun layouts and fixture OG`
