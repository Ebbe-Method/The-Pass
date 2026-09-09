# The Pass — spec 3: runtime overlay (Layer B)

Date: 2026-09-09
Status: parser + matcher shipped. Cursor Cloud list needs a token at runtime.

## Problem

Layer A knows GitHub facts. It does not know which agent is on the ticket, whether the session is live, or the deep link.

## Approach

Two signals:

1. Heartbeat HTML comment in the issue/PR body or a comment:

```html
<!-- kitchen:claim runtime="cursor" session="https://cursor.com/agents/bc-…" -->
```

2. Cursor Cloud agent list when a token exists. Match on `branchName` / `source.github.prUrl`. Do not use naive `includes` on the issue number.

Missing overlay → honest empty chip. Click goes to GitHub.

Do not patch fuse-on-v2 first. Consumers copy `docs/heartbeat.md`.

## Success

A cooking ticket with a heartbeat shows Cursor + a live session link. Unknown stays empty, never a guessed face.
