# The Pass — spec 1: brand, design system, public demo kiosk

Date: 2026-09-09
Status: implementation-complete (this session built the demo after writing the design). User review of this spec is still the Superpowers gate for future changes.

## Problem

People running many parallel coding agents need a room-readable GitHub glance. Status quo is Projects + github.com/pulls + cursor.com/agents + overnight comments. That cobble is not glanceable from a TV or a second monitor.

## Locked product

- Box name: **The Pass**. Alts: Chit, Hot Lamp. Do not ship "Kitchen Board" on the box.
- One-liner: "Your agents are cooking. Don't let tickets go cold."
- Subhead: a kitchen display for GitHub issues and PRs.
- Job: Operate (wall) + Experience (magic moment). Not Persuade — no marketing landing page.
- The kiosk URL is `/`. Zero GitHub. Zero signup.
- Fun is heat and motion. Not clip-art food. Not Pulldog confetti.

## Time budgets

- Time-to-hello-world: tickets on screen in under 3 seconds.
- Time-to-magic-moment: under 12 seconds, no click. A ticket tears onto the rail and goes hot. One click jumps to the mock session or GitHub fixture.

## What a card shows

One issue or one PR. Wait clock, freshness clock, state in three words (queued / cooking / waiting on you / stale), actor chips, progress as events. Click: GitHub always; session URL when Layer B knows it.

## Design system

Three layers, one look:

1. Impeccable language (`PRODUCT.md`, `DESIGN.md`).
2. shadcn/Radix/Tailwind v4/CVA for chrome.
3. Beautiful UI craft (Task Rows, Tool Chips, Approval Card) restyled with our tokens.

Custom: Ticket, Rail, HeatClock, ActorChip, EmptyPass.

Whitelist: heat pulse on waiting/stale; printer-tear motion; paper-ticket material.

## Shotgun

Three compositions in `public/shotgun/`: expo window (winner), two pits, station swimlanes. Live toggle: `?layout=` and `?distance=`.

## Out of scope (this spec)

GitHub App, webhooks, Marketplace, Layer B matching, personalized OG, billing, Pi kits.

## Success

A stranger understands the demo in five seconds. You would post the still. `/design` looks like a product. Audit is clean except the documented heat-pulse whitelist.
