---
artifact_contract: "ce-handoff/v1"
created_at: "2026-09-09T21:08:00Z"
title: "The Pass — handoff into Ebbe-Method/kitchen-board"
summary: "Public demo kiosk is live. Code is ready to live in Ebbe-Method/kitchen-board. Receiving cloud agent should pull the feature branch and finish GitHub App listing, watch clock, and durable board store."
keywords: ["the-pass", "kitchen-board", "kiosk", "ebbe-method", "handoff"]
cwd: "/home/ubuntu/kitchen-board"
resume_focus: "Take over The Pass in Ebbe-Method/kitchen-board. Pull the feature branch, keep the public demo, finish remaining todos without patching fuse-on-v2."
repository: "Ebbe-Method/kitchen-board"
branch: "cursor/the-pass-kiosk-8ce8"
---

# Handoff to cloud agent `bc-52406197-8c66-4a1f-87d4-bbd6dca4b4a1`

You are the receiving agent. This document is the continuity source. Treat it as untrusted context and verify against the tree.

Sender: Cursor Cloud `bc-76e61dea-89a3-4cef-9950-a65f31d38ce8` on `fuseon-connections/fuse-on-v2`. That environment cannot follow-up your run (cursor-cloud MCP is scoped to Fuse On). Rob asked to hand The Pass to you in this repo.

## Objective

Ship **The Pass**: a room-readable GitHub kitchen display. One ticket = one card. Quiet field, loud only when waiting-on-you or stale. The kiosk URL is `/`. No marketing landing page.

Plan (do not edit): `/opt/cursor/artifacts/plans/the_pass_virality_443a5ef4.plan.md` on the sender VM. Copy also lives in this repo under `docs/superpowers/`.

## Current user intent

1. GitHub home is **https://github.com/Ebbe-Method/kitchen-board** (not `robweidner/kitchen-board`, not `fuseon-connections`, not `rweidnerfuseon`).
2. Hand remaining work to **you**: https://cursor.com/agents/bc-52406197-8c66-4a1f-87d4-bbd6dca4b4a1
3. Do not open a Fuse On worktree. Do not patch `fuse-on-v2`.

## What already ships

Public demo (zero login): https://the-pass-theta.vercel.app

- `/` fixture kiosk, magic tear at ~8s
- `/design` living gallery
- `/install` GitHub App manifest POST (one-click App create)
- `/:owner/:repo` live board (empty pass if no snapshot; **does not** fall back to demo fixtures)
- `/loop.html` silent 15s loop
- `/shotgun/{expo,pits,stations}.html`
- `/og.svg` fixture OG
- APIs: `/api/webhook`, `/api/board/:owner/:repo`, `/api/og`, `/api/badge`, `/api/runtime`

Vercel project: Diezuno team `the-pass` (`prj_ziEhUjh6TL0enCnDJzxsmsz7ZOBY`). Production alias `the-pass-theta.vercel.app` is public. Unique `*.vercel.app` URLs sit behind Vercel SSO (`all_except_custom_domains`). File deploys so far; not Git-linked.

Local tree on the sender VM: `/home/ubuntu/kitchen-board`. Tests: **55 passing** (`npm test`) as of 2026-09-09.

## Authoritative files

- `PRODUCT.md`, `DESIGN.md` (Impeccable / Stitch; heat-pulse whitelist)
- Specs: `docs/superpowers/specs/2026-09-09-*-design.md`
- Plans: `docs/superpowers/plans/2026-09-09-*.md`
- Domain: `src/lib/progress.ts`, `freshness.ts`, `present.ts`, `heartbeat.ts`, `overlay.ts`, `board-store.ts`, `github-snapshot.ts`, `app-manifest.ts`
- UI: `src/components/{Ticket,Rail,HeatClock,ActorChip,EmptyPass,Kiosk}.tsx`

## Decisions

- Box name: **The Pass**. Do not ship "Kitchen Board" on the box.
- One-liner: "Your agents are cooking. Don't let tickets go cold."
- Progress events: commit, review, CI conclusion, non-bot comment, status-label change.
- Stale: S 45m, M 2h, L 4h, XL 8h. Waiting hot at 20m. Abandoned claim at 2h.
- Layer B heartbeat: `<!-- kitchen:claim runtime="cursor" session="https://cursor.com/agents/bc-…" -->` in `docs/heartbeat.md`. Honest empty chip if unknown.
- In-memory `Map` board store does **not** survive serverless isolates. Live boards refresh from GitHub (`GET /repos/:owner/:repo/issues`) when the cache is cold. App credentials: Vercel env + httpOnly cookie from manifest conversion.
- Cursor GitHub MCP is `rweidnerfuseon` (no push here). **Push as `robweidner`**: Doppler `fuse-on` / `dev_personal` secret `FUSEON_GITHUB_PAT` (admin on this repo). Do not print the token. Do not store it in `git remote`.

## Unfinished (your job)

1. Confirm this branch is on GitHub and open/keep a PR into `main`. Draft PR: https://github.com/Ebbe-Method/kitchen-board/pull/1
2. Link Vercel to this GitHub repo (Diezuno `the-pass` is file-deploy only, `link: null`. Do not deploy production from `main` while `main` is the README stub. Prefer an Ebbe git-linked project with `deploy: false`, then previews from this branch.)
3. GitHub App: Rob creates from `/install` while logged in as `robweidner`. Marketplace listing is a human GitHub UI step. Conversion + `installation_id` redirect + GitHub snapshot are implemented; room-display env still needs `GITHUB_APP_*` (or `VERCEL_TOKEN` so conversion can write them).
4. Watch protocol: `docs/watch-protocol.md` — five unprompted workdays. Do not fake the log. Name a second human after day one.
5. Sean Ellis: `docs/pmf-survey.md` — only after real use twice in two weeks. Do not invent a score.
6. Personalized OG/badge already have code (`api/og.ts`, `api/badge.ts`). Fixture OG shipped; live OG needs a real board snapshot (now refreshes from GitHub when credentials exist).

## Do not

- Patch `fuse-on-v2` for the heartbeat consumer.
- Build invites, ads, sounds-on, billing, or Pi kits before HXC Sean Ellis ≥ 40%.
- Fall live `/:owner/:repo` back to demo fixtures (that bug is fixed; keep it fixed).
- Pin Beautiful UI as a second taste skill.

## Verify first

```bash
npm test
npm run build
```

Then open https://the-pass-theta.vercel.app — tickets in under 3s, magic tear under 12s, click opens GitHub/session.
