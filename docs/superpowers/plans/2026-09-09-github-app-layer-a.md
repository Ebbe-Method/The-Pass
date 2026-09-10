# Spec 2 plan — GitHub App Layer A

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

## Task 1: Event classifier

Failing tests in `src/lib/github-events.test.ts`, then `src/lib/github-events.ts`.

## Task 2: Board store

`src/lib/board-store.ts` — apply events, get board.

## Task 3: Webhook + board API

`api/webhook.ts`, `api/board.ts`, `vercel.json` rewrites.

## Task 4: Live kiosk route

`/:owner/:repo` fetches the board, falls back to fixtures if empty.

## Task 5: Manifest + install page

`public/app-manifest.json`, `/install`.
