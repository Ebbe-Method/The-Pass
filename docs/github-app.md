# GitHub App (Layer A) — human steps

Marketplace listing is a GitHub UI step on **robweidner**. Repo home: https://github.com/Ebbe-Method/kitchen-board.

Code on `/install` already posts the manifest, converts the one-shot `code`, and redirects to GitHub install. After install, GitHub returns `installation_id` to `/install`, which snapshots open issues and sends you to `/{owner}/{repo}`.

Read permissions: issues, pull requests, checks, contents (`push`), actions (`workflow_run`), metadata. GitHub rejects the manifest if `push` or `workflow_run` are subscribed without those two.

1. Open https://the-pass-theta.vercel.app/install while logged in as `robweidner`.
2. Create the App (Ebbe-Method org, or personal).
3. Install on a repo. Land on `https://<host>/<owner>/<repo>` already in kiosk.
4. Marketplace listing waits on watched use (five workdays) and Sean Ellis ≥ 40% among people who actually ran it.

If install needs a docs page beyond `/install`, the time-to-own-data bar failed.

The board store uses GitHub as the source of truth: `GET /api/board/:owner/:repo` snapshots open issues when the in-memory cache is cold. Webhooks keep a warm isolate current.

App credentials (`GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_WEBHOOK_SECRET`) live in Vercel env for the room display. Conversion writes them when `VERCEL_TOKEN` is present, and keeps an httpOnly cookie so the installing browser can open the kiosk immediately.
