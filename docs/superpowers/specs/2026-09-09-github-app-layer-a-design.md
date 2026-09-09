# The Pass — spec 2: GitHub App + live tickets (Layer A)

Date: 2026-09-09
Status: architecture shipped; Marketplace listing is a human step on GitHub.

## Problem

The demo is fixture data. Time-to-own-data must be Marketplace Install → `https://<host>/<org>/<repo>` already a kiosk. No PAT, no `.env`, no `npm i`.

## Approach chosen

GitHub App (not OAuth user token, not PAT). Permissions: issues, pull requests, checks, contents, actions, metadata (all read). Webhooks: issues, issue_comment, pull_request, pull_request_review, push, check_run, workflow_run. `push` needs contents; `workflow_run` needs actions.

Snapshot on install; webhooks after. In-memory store in this slice (swap for durable later). Kiosk polls `/api/board/:owner/:repo` every 8s.

## Manifest

`public/app-manifest.json` is the one-click create form. Install URL after GitHub registers the App: `https://github.com/apps/<slug>/installations/new`.

Landing after install: `https://<host>/<org>/<repo>`.

## Out of scope

Layer B runtime overlay. Personalized OG. Billing. Multi-repo plans.

## Success

Install → own kiosk in one click. Point at waiting-on-you, silent, and cooking without opening GitHub.
