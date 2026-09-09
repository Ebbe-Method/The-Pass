# The Pass

Your agents are cooking. Don't let tickets go cold.

A kitchen display for GitHub issues and PRs. Who is on it. Is it moving. Is it going stale.

[![the pass](./public/badge.svg)](https://the-pass.vercel.app)

Intended GitHub home: `robweidner/kitchen-board`. This session could not create that repo (the GitHub token is `rweidnerfuseon`). Code lives in this tree until Rob creates or transfers it.

## Demo

Open `/`. Zero GitHub. Zero signup. Tickets should paint in under 3 seconds. At ~8 seconds a ticket tears onto the rail and goes hot. Click it.

```bash
npm install
npm run dev
```

Then http://localhost:5173

- Living system: `/design`
- Silent 15s loop: `/loop.html`
- Shotgun: `/shotgun/expo.html` `/shotgun/pits.html` `/shotgun/stations.html`
- Fixture OG: `/og.svg`
- Live OG: `/api/og?owner=acme&repo=widgets` (`&blur=1` hides titles)

## Install on your repo

Marketplace install should land on `https://<host>/<org>/<repo>` already in kiosk. No PAT, no `.env`, no `npm i`.

Manifest: [`public/app-manifest.json`](public/app-manifest.json). Steps: [`docs/github-app.md`](docs/github-app.md).

Webhook: `POST /api/webhook`. Board: `GET /api/board/:owner/:repo`. Badge: `GET /api/badge?owner=&repo=`. Runtime overlay: `POST /api/runtime`.

Until Marketplace lists the App, the public demo is the product.

## Heartbeat (Layer B)

```html
<!-- kitchen:claim runtime="cursor" session="https://cursor.com/agents/bc-…" -->
```

Missing overlay → empty chip. Click goes to GitHub. See [`docs/heartbeat.md`](docs/heartbeat.md).

## What counts as progress

Commit, review, CI conclusion, non-bot comment, status-label change. Not bot lint, not Projects field writes, not description edits.

Size-aware stale: S 45m, M 2h, L 4h, XL 8h. Waiting-on-you heats at 20m. Abandoned claim (in-flight, 0 comments, no PR, 2h) is its own alarm.

## Watch and PMF

Five unprompted workdays: [`docs/watch-protocol.md`](docs/watch-protocol.md). Sean Ellis after real use twice in two weeks: [`docs/pmf-survey.md`](docs/pmf-survey.md). Do not bill, ads, or sounds-on until HXC ≥ 40% very-disappointed.
