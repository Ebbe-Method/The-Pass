# GitHub App (Layer A) — human steps

Code for webhooks, the board API, and the manifest is in this repo. Marketplace listing is a GitHub UI step on **robweidner**. Repo home: https://github.com/Ebbe-Method/kitchen-board.

1. Open https://github.com/settings/apps/new while logged in as `robweidner`.
2. Paste [`public/app-manifest.json`](../public/app-manifest.json). Hook URL is `https://<host>/api/webhook`.
3. Install on one repo.
4. Open `https://<host>/<owner>/<repo>`. That URL is already the kiosk.
5. Marketplace listing waits on watched use (five workdays) and Sean Ellis ≥ 40% among people who actually ran it.

If install needs a docs page beyond `/install`, the time-to-own-data bar failed.
