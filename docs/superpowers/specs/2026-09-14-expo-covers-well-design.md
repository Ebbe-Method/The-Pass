# The Pass — spec 3: expo, covers, and the well

Date: 2026-09-14
Status: design approved; not implemented. Watched repo is Fuse On (`fuseon-connections/fuse-on-v2`). Code stays on `Ebbe-Method/kitchen-board`.

## Problem

Live Fuse On has hundreds of open issues and PRs. The kiosk paints every ticket as the same grid cell. Size already changes the stale clock (`size:S|M|L|XL` → 45m / 2h / 4h / 8h) but is invisible. Labels sit on the ticket and never print. Clocks say how long a plate has been sitting, not how long until it is late. There is no fire limit, so the wall cannot answer “what can we walk” versus “we are already slammed.”

The glance is a restaurant pass plus a fast-food late lamp: what is about to go out the door, how much is on the fire (count and plate size), and a cap so we do not over-fire for usage or burnout.

## Locked product

- **Covers:** S=1, M=2, L=4, XL=8.
- **Two meters:** human/expo cap **8** covers; agent/line cap **24** covers. Header shows `used / cap`. Over cap is slammed (existing heat color + the word). Not a third color. Caps are kiosk constants this slice, not a GitHub setting.
- **Three places:** expo, line, well. Not a Projects board and not “show all 400 cards with a number in the corner.”
- **Size source:** `size:S|M|L|XL` always wins. If missing, infer at snapshot time so Fuse On is not a wall of identical M’s. Inference never overrides a real size label.
- **Approach:** zones + physically sized chits + countdown to stale + at most a few kitchen chips. Not equal cards with only meters. Not a dump of every GitHub label.

## Size inference (unlabeled only)

Computed when mapping a GitHub issue/PR to a ticket. Use payload we already snapshot (or can add without a new permission): labels, title, body length, milestone, kind (issue vs PR).

- Small PR (short body; no epic/milestone) → S.
- `epic` label or a milestone → XL.
- Long body, no epic/milestone → L.
- Everything else → M.

File-count via `contents` is optional later, not required to ship. Unknown cook stays an honest unknown chip.

## Expo, line, well

**Expo (human, cap 8).** Waiting on you, green CI on a PR, `status:needs-rob`, **and stale**. Always on the pass — plates under the lamp. Stale is spec 1’s late lamp; it is not queued and it is not line overflow. The **human meter** counts covers of every expo ticket (including stale). Over cap → slammed meter; **do not hide** these cards. Hiding “needs Rob” or a stale plate is how tickets go cold.

**Line (agents, cap 24).** Cooking only: `status:in-flight`, agent runtime, open PR that is not ready to walk. Stale does not sit here. The **agent meter** counts covers of every cooking ticket (on the rail and in the well). Rank hottest, then closest-to-stale. Paint cards until 24 covers fill (greedy: skip a plate that does not fit and keep filling with later ones that do). Overflow is not a card; it still counts on the meter so slammed can fire.

**Well.** Queued plus line overflow. Not stale. One quiet line, e.g. `86 in the well`. This slice is count-only (no drill-in list).

## The wall

Header replaces the single “hot on the pass” count with the two cover meters.

Expo is a **top strip** of paper tickets, not a separate chrome widget and not a left pit.

Line uses the remaining expo-style rail. S chits are narrow; M is today’s card; L spans two columns; XL is widest/tallest. 10ft (`?distance=10ft`) keeps `#` and clocks; chips may drop.

**On the chit:** title + `#`, state mark (○ queued / ◌ cooking / ● waiting on you / ▲ stale), **countdown to stale** as the loud clock (late lamp when hot), sitting-time secondary. Chips: PR vs issue, S/M/L/XL, at most one status (`needs-rob`, `in-flight`). No assignee pile, milestone row, or label cloud.

Click still opens GitHub (session URL when Layer B has it). Sound off. One heat color, always with a word and a mark. Stale budgets stay spec 1’s table (S 45m, M 2h, L 4h, XL 8h). Heat pulse whitelist unchanged: waiting/stale only.

## Data flow

GitHub remains source of truth (`GET /api/board/:owner/:repo`, webhooks). Size (label or inferred) is set when we map an issue to a ticket. The kiosk **presents** expo / line / well in the client from that snapshot. No new backend store this slice.

Live `/:owner/:repo` must not fall back to demo fixtures. Homepage demo on `/` may keep fixtures.

## Errors

If a snapshot fails, keep the last board. Do not invent tickets. Missing size label → inferred size, never blank. Over-cap expo stays visible. Over-cap line goes to the well count.

## Tests

- Size: label wins; small PR; epic/long issue; default M.
- Cover math: S/M/L/XL → 1/2/4/8; human 8; agent 24.
- Split: expo vs line vs well at those caps; expo not dropped when human meter is slammed.
- Countdown to stale by size.
- Layout: S/M/L/XL occupy different slots; well is a count.

## Out of scope

Well drill-in list. Editable caps UI. Marketplace. Changes to `fuse-on-v2` itself. Assignees, milestones, full label clouds. File-count inference. Durable board store. Layer B session matching.

## Success

From two feet on Fuse On, you can see what to walk, whether the human or agent fire is slammed, and which plates are sides vs banquets — without opening GitHub. The well is a number, not a second dashboard. You would still post the still.
