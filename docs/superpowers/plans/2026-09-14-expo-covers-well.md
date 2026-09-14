# Expo, covers, and the well — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Fuse On kiosk a restaurant pass: sized chits, cover meters (human 8 / agent 24), expo always walks, the line paints until 24 covers, the well is a count.

**Architecture:** Keep GitHub as source of truth. Infer unlabeled size at snapshot/webhook map time. Present expo / line / well and both meters on the client from the existing board snapshot. No new backend store. Default `?layout=expo` is the spec wall; pits/stations stay shotgun views of every visible ticket.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind v4, Vitest, Testing Library. Run tests with `npx vitest run <file>`. Typecheck with `npx tsc -b`.

**Spec:** `docs/superpowers/specs/2026-09-14-expo-covers-well-design.md`

## Global Constraints

- Covers: S=1, M=2, L=4, XL=8. Human/expo cap **8**. Agent/line cap **24**. Caps are kiosk constants, not a GitHub setting.
- `size:S|M|L|XL` always wins. Inference never overrides a real size label.
- Inference (unlabeled only): epic label or milestone → XL; else small PR (body `< 400` chars) → S; else long body (`>= 1500` chars) → L; else M. No file-count inference.
- Expo = `waiting_on_you` **and** `stale`. Always painted. Human meter counts every expo cover. Over cap does not hide cards.
- Line = `cooking` only. Rank hottest, then closest-to-stale (`remainingMs` ascending). Greedy fill to 24 covers (skip a plate that does not fit; keep taking later ones that do). Overflow is not a card; it still counts on the agent meter.
- Well = queued ticket count + cooking overflow count. Copy: `{n} in the well`. Count-only; no drill-in.
- Loud clock = countdown to stale (`STALE_MS`: S 45m, M 2h, L 4h, XL 8h). `0` → `late`. Sitting-time (`waitMs` / open) is secondary. Do not use `formatClock`’s `just in` for remaining time.
- Chips on the chit: PR vs issue, size letter, at most one kitchen status (`needs-rob` wins over `in-flight`). Keep honest unknown-cook `ActorChip`. No assignee / milestone / GitHub label cloud. Drop the last-progress label from the card.
- `?distance=10ft` keeps `#` and clocks; hide `.ticket-chips`.
- Over cap = existing heat color + the word `slammed`. Not a third color. Slammed means `used > cap`, not `used === cap`.
- Live `/:owner/:repo` must not fall back to demo fixtures. If a later poll fails, keep the last board. First load with no snapshot still shows the empty pass.
- Do not fetch check-runs this slice. `ticket.ci` stays whatever the snapshot already stored (`'none'` on live GitHub issues). Green-CI expo still works when `ci === 'green'` (demo fixtures, future Layer).
- Do not change `fuse-on-v2`. Do not add well drill-in, editable caps, Marketplace, Layer B session matching, or a durable store.
- Heat pulse whitelist unchanged: waiting / stale only. Sound stays off. Click still opens GitHub (session URL when present).
- Repo: `Ebbe-Method/The-Pass`. Watched test repo: `fuseon-connections/fuse-on-v2`.

---

## File map

| File | Role |
| --- | --- |
| `src/lib/covers.ts` | Cover weights and caps. |
| `src/lib/covers.test.ts` | Cover math. |
| `src/lib/labels.ts` | `sizeFromLabels` → `Size \| null`; `inferSize`; `sizeForTicket`; `kitchenChip`. |
| `src/lib/labels.test.ts` | Label wins, inference table, kitchen chip. |
| `src/lib/github-snapshot.ts` | Add `milestone` on `GithubIssueLike`; size via `sizeForTicket`. |
| `src/lib/github-snapshot.test.ts` | Inference through the mapper. |
| `src/lib/board-store.ts` | Webhook mapper uses `sizeForTicket`; keep prior inferred size when the payload has no size label. |
| `src/lib/board-store.test.ts` | Unlabeled long body sticks across a later label event. |
| `src/lib/freshness.ts` | `remainingToStaleMs`. |
| `src/lib/freshness.test.ts` | Countdown by size. |
| `src/lib/format.ts` | `formatCountdown`. |
| `src/lib/format.test.ts` | `late` / `<1m` / hours. |
| `src/lib/present.ts` | `remainingMs` on `PresentedTicket`; export `HEAT_RANK`; sort closest-to-stale. |
| `src/lib/present.test.ts` | Remaining + sort. |
| `src/lib/pass-layout.ts` | `layoutPass` — expo / line / well / meters. |
| `src/lib/pass-layout.test.ts` | Caps, greedy fill, stale on expo, well count. |
| `src/components/HeatClock.tsx` | Optional `format` fn. |
| `src/components/Ticket.tsx` | `data-size`, countdown loud, chips. |
| `src/components/CoverMeter.tsx` | Header `used / cap` + slammed word. |
| `src/components/Rail.tsx` | Expo strip + sized line + well count. |
| `src/components/Kiosk.tsx` | Two meters from `layoutPass`. |
| `src/index.css` | Size slots; hide chips at 10ft. |
| `src/components/Kiosk.test.tsx` | Well copy, meters, magic tear still works. |
| `src/components/Rail.test.tsx` | `data-size` slots; well-only pass is not “clear”. |
| `src/pages/RepoBoardPage.tsx` | Keep last tickets on poll failure. |
| `src/pages/RepoBoardPage.test.tsx` | Failed poll does not wipe a live board; still no fixture fallback. |
| `src/pages/DesignSystem.tsx` | S/M/L/XL examples. |
| `src/pages/DesignSystem.test.tsx` | Covers heading and sized titles. |

---

### Task 1: Cover weights and caps

**Files:**
- Create: `src/lib/covers.ts`
- Test: `src/lib/covers.test.ts`

**Interfaces:**
- Consumes: `Size` from `src/kiosk/types.ts`
- Produces: `COVERS`, `HUMAN_COVER_CAP`, `AGENT_COVER_CAP`, `coversFor(size: Size): number`

- [ ] **Step 1: Write the failing test**

Create `src/lib/covers.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  AGENT_COVER_CAP,
  COVERS,
  HUMAN_COVER_CAP,
  coversFor,
} from './covers'

describe('covers', () => {
  it('weights S/M/L/XL as 1/2/4/8', () => {
    expect(COVERS).toEqual({ S: 1, M: 2, L: 4, XL: 8 })
    expect(coversFor('S')).toBe(1)
    expect(coversFor('M')).toBe(2)
    expect(coversFor('L')).toBe(4)
    expect(coversFor('XL')).toBe(8)
  })

  it('caps human expo at 8 and the agent line at 24', () => {
    expect(HUMAN_COVER_CAP).toBe(8)
    expect(AGENT_COVER_CAP).toBe(24)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/covers.test.ts`

Expected: FAIL — cannot find module `./covers`

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/covers.ts`:

```ts
import type { Size } from '../kiosk/types'

export const COVERS: Record<Size, number> = {
  S: 1,
  M: 2,
  L: 4,
  XL: 8,
}

export const HUMAN_COVER_CAP = 8
export const AGENT_COVER_CAP = 24

export function coversFor(size: Size): number {
  return COVERS[size]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/covers.test.ts`

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/covers.ts src/lib/covers.test.ts
git commit -m "feat: cover weights and human/agent caps"
```

---

### Task 2: Size inference (label wins)

**Files:**
- Modify: `src/lib/labels.ts`
- Modify: `src/lib/labels.test.ts`
- Modify: `src/lib/github-snapshot.ts`
- Modify: `src/lib/github-snapshot.test.ts`
- Modify: `src/lib/board-store.ts`
- Modify: `src/lib/board-store.test.ts`

**Interfaces:**
- Consumes: `Size`, `TicketKind` from `src/kiosk/types.ts`
- Produces:
  - `sizeFromLabels(labels: string[]): Size | null` — `null` when unlabeled (no more silent M)
  - `SHORT_PR_BODY_CHARS = 400`, `LONG_BODY_CHARS = 1500`
  - `inferSize(hints: SizeHints): Size`
  - `sizeForTicket(hints: SizeHints): Size`
  - `SizeHints = { kind: TicketKind; labels: string[]; body?: string | null; milestone?: unknown }`
  - `GithubIssueLike.milestone?: { title?: string } | null`

Epic means a label whose name equals `epic` case-insensitively. Milestone means a non-null `milestone` object (GitHub sends `null` when absent).

Webhook rule: `sizeFromLabels(labels) ?? (existing ticket size) ?? sizeForTicket(...)`. A later `labeled` event without a size label must not flatten an inferred L back to M.

- [ ] **Step 1: Write the failing tests**

Replace `src/lib/labels.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import {
  inferSize,
  kitchenChip,
  sizeForTicket,
  sizeFromLabels,
} from './labels'

describe('sizeFromLabels', () => {
  it('reads size:S through size:XL', () => {
    expect(sizeFromLabels(['ready-for-agent', 'size:S'])).toBe('S')
    expect(sizeFromLabels(['size:XL'])).toBe('XL')
  })

  it('returns null when the size label is missing', () => {
    expect(sizeFromLabels(['status:in-flight'])).toBeNull()
  })
})

describe('inferSize', () => {
  it('treats epic or a milestone as XL', () => {
    expect(
      inferSize({ kind: 'issue', labels: ['epic'], body: 'short' }),
    ).toBe('XL')
    expect(
      inferSize({
        kind: 'pr',
        labels: [],
        body: 'tiny',
        milestone: { title: 'Launch' },
      }),
    ).toBe('XL')
  })

  it('treats a short unlabeled PR as S', () => {
    expect(
      inferSize({ kind: 'pr', labels: [], body: 'please review' }),
    ).toBe('S')
  })

  it('treats a long unlabeled body as L', () => {
    expect(
      inferSize({ kind: 'issue', labels: [], body: 'x'.repeat(1500) }),
    ).toBe('L')
  })

  it('defaults everything else to M', () => {
    expect(inferSize({ kind: 'issue', labels: [], body: 'hi' })).toBe('M')
  })
})

describe('sizeForTicket', () => {
  it('lets a size label win over epic and body length', () => {
    expect(
      sizeForTicket({
        kind: 'pr',
        labels: ['size:S', 'epic'],
        body: 'x'.repeat(2000),
        milestone: { title: 'Launch' },
      }),
    ).toBe('S')
  })
})

describe('kitchenChip', () => {
  it('prints at most one status and prefers needs-rob', () => {
    expect(kitchenChip(['status:in-flight'])).toBe('in-flight')
    expect(kitchenChip(['status:needs-rob', 'status:in-flight'])).toBe(
      'needs-rob',
    )
    expect(kitchenChip(['ready-for-agent'])).toBeNull()
  })
})
```

Note: `kitchenChip` is used in Task 5. Implement it in this task so Ticket does not invent a third label parser.

Add to `src/lib/github-snapshot.test.ts` (keep existing cases):

```ts
  it('infers S for an unlabeled short PR', () => {
    const ticket = ticketFromGithubIssue('acme', 'widgets', {
      number: 20,
      title: 'Typo',
      html_url: 'https://github.com/acme/widgets/pull/20',
      labels: [],
      pull_request: { url: 'https://api.github.com/repos/acme/widgets/pulls/20' },
      body: 'fix typo',
    })
    expect(ticket.size).toBe('S')
  })

  it('infers XL from epic or milestone when unlabeled', () => {
    const epic = ticketFromGithubIssue('acme', 'widgets', {
      number: 21,
      title: 'Platform rewrite',
      labels: ['epic'],
      body: 'hi',
    })
    expect(epic.size).toBe('XL')
    const milestoned = ticketFromGithubIssue('acme', 'widgets', {
      number: 22,
      title: 'Launch work',
      labels: [],
      body: 'hi',
      milestone: { title: 'v2' },
    })
    expect(milestoned.size).toBe('XL')
  })
```

Add to `src/lib/board-store.test.ts`:

```ts
  it('keeps an inferred size when a later webhook has no size label', () => {
    applyGithubEvent('acme', 'infer-lab', {
      name: 'issues',
      payload: {
        action: 'opened',
        issue: {
          id: 11,
          number: 91,
          title: 'Long unlabeled',
          html_url: 'https://github.com/acme/infer-lab/issues/91',
          created_at: '2026-09-09T12:00:00.000Z',
          labels: [],
          comments: 0,
          body: 'x'.repeat(1500),
        },
      },
    })
    const snapshot = applyGithubEvent('acme', 'infer-lab', {
      name: 'issues',
      payload: {
        action: 'labeled',
        issue: {
          id: 11,
          number: 91,
          title: 'Long unlabeled',
          html_url: 'https://github.com/acme/infer-lab/issues/91',
          labels: [{ name: 'status:in-flight' }],
          comments: 0,
        },
        label: { name: 'status:in-flight' },
      },
    })
    expect(snapshot.tickets[0].size).toBe('L')
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/labels.test.ts src/lib/github-snapshot.test.ts src/lib/board-store.test.ts`

Expected: FAIL — `sizeFromLabels` still returns `'M'`; `inferSize` / `kitchenChip` / `sizeForTicket` are not exported; snapshot unlabeled PR is `'M'`; webhook size is `'M'`.

- [ ] **Step 3: Write minimal implementation**

Replace `src/lib/labels.ts`:

```ts
import type { Size, TicketKind } from '../kiosk/types'

export const SHORT_PR_BODY_CHARS = 400
export const LONG_BODY_CHARS = 1500

export type SizeHints = {
  kind: TicketKind
  labels: string[]
  body?: string | null
  milestone?: unknown
}

export type KitchenStatus = 'needs-rob' | 'in-flight'

export function sizeFromLabels(labels: string[]): Size | null {
  for (const label of labels) {
    const match = /^size:(S|M|L|XL)$/i.exec(label)
    if (match) return match[1].toUpperCase() as Size
  }
  return null
}

function hasEpic(labels: string[]): boolean {
  return labels.some((label) => label.toLowerCase() === 'epic')
}

function hasMilestone(milestone: unknown): boolean {
  return milestone != null
}

export function inferSize(hints: SizeHints): Size {
  if (hasEpic(hints.labels) || hasMilestone(hints.milestone)) return 'XL'
  const bodyLen = hints.body?.length ?? 0
  if (hints.kind === 'pr' && bodyLen < SHORT_PR_BODY_CHARS) return 'S'
  if (bodyLen >= LONG_BODY_CHARS) return 'L'
  return 'M'
}

export function sizeForTicket(hints: SizeHints): Size {
  return sizeFromLabels(hints.labels) ?? inferSize(hints)
}

export function kitchenChip(labels: string[]): KitchenStatus | null {
  const names = labels.map((label) => label.toLowerCase())
  if (names.includes('status:needs-rob')) return 'needs-rob'
  if (names.includes('status:in-flight')) return 'in-flight'
  return null
}
```

In `src/lib/github-snapshot.ts`:

- Add `milestone?: { title?: string } | null` to `GithubIssueLike`.
- Change the size line to:

```ts
    size: sizeForTicket({
      kind,
      labels,
      body: issue.body,
      milestone: issue.milestone,
    }),
```

Import `sizeForTicket` instead of `sizeFromLabels`. Compute `kind` before `size` (already the case).

In `src/lib/board-store.ts` `ticketFromPayload`:

- Read `body` and `milestone` from the issue/PR object.
- Import `sizeFromLabels` and `sizeForTicket`.
- Set `kind` first, then:

```ts
  const incomingSize = sizeForTicket({
    kind,
    labels,
    body: 'body' in issue ? (issue.body as string | null | undefined) : undefined,
    milestone: 'milestone' in issue ? issue.milestone : undefined,
  })
```

Return that as `size: incomingSize` on the new ticket object.

In `applyGithubEvent`, when merging `next`:

```ts
      size: sizeFromLabels(incoming.labels) ?? prior.size,
```

`prior` is `incoming` on first insert, so a brand-new ticket keeps `incoming.size`. A later event without a size label keeps the inferred size.

Widen the local issue type to include `body?: string | null` and `milestone?: { title?: string } | null`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/labels.test.ts src/lib/github-snapshot.test.ts src/lib/board-store.test.ts`

Expected: PASS. Also run `npx vitest run src/lib/board-refresh.test.ts` — still PASS (fixture has `size:M`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/labels.ts src/lib/labels.test.ts src/lib/github-snapshot.ts src/lib/github-snapshot.test.ts src/lib/board-store.ts src/lib/board-store.test.ts
git commit -m "feat: infer unlabeled ticket size without overriding size labels"
```

---

### Task 3: Countdown to stale

**Files:**
- Modify: `src/lib/freshness.ts`
- Modify: `src/lib/freshness.test.ts`
- Modify: `src/lib/format.ts`
- Modify: `src/lib/format.test.ts`
- Modify: `src/lib/present.ts`
- Modify: `src/lib/present.test.ts`

**Interfaces:**
- Consumes: `STALE_MS`, `freshnessMs`, `Ticket`
- Produces:
  - `remainingToStaleMs(ticket: Ticket, now: number): number` — `max(0, STALE_MS[size] - freshnessMs)`
  - `formatCountdown(ms: number): string` — `<= 0` → `'late'`; under 1 minute → `'<1m'`; otherwise same buckets as `formatClock`
  - `PresentedTicket.remainingMs: number`
  - `export const HEAT_RANK: Record<Heat, number>`
  - `sortPresented` ties broken by `remainingMs` ascending (closest to late first), not `freshMs` descending

Every state uses the size budget, including `waiting_on_you` and `queued`. `stateFor` does not change.

- [ ] **Step 1: Write the failing tests**

Add to `src/lib/freshness.test.ts`:

```ts
import { remainingToStaleMs } from './freshness'
```

And:

```ts
describe('remainingToStaleMs', () => {
  it('counts down the size budget from last progress', () => {
    const t = ticket({
      size: 'S',
      labels: ['status:in-flight'],
      commentCount: 3,
      hasLinkedPr: true,
    })
    expect(remainingToStaleMs(t, T0 + 15 * 60 * 1000)).toBe(30 * 60 * 1000)
    expect(remainingToStaleMs(t, T0 + STALE_MS.S)).toBe(0)
    expect(remainingToStaleMs(t, T0 + STALE_MS.S + 60_000)).toBe(0)
  })

  it('uses the XL budget when the plate is XL', () => {
    const t = ticket({
      size: 'XL',
      labels: ['status:in-flight'],
      commentCount: 3,
      hasLinkedPr: true,
    })
    expect(remainingToStaleMs(t, T0 + STALE_MS.S)).toBe(STALE_MS.XL - STALE_MS.S)
  })
})
```

Keep the existing `formatClock` tests. Change the import to `import { formatClock, formatCountdown } from './format'` and append:

```ts
describe('formatCountdown', () => {
  it('says late at or under zero', () => {
    expect(formatCountdown(0)).toBe('late')
    expect(formatCountdown(-12_000)).toBe('late')
  })

  it('does not say just in for remaining seconds', () => {
    expect(formatCountdown(12_000)).toBe('<1m')
  })

  it('uses the same hour buckets as sitting time', () => {
    expect(formatCountdown(12 * 60 * 1000)).toBe('12m')
    expect(formatCountdown(3 * 60 * 60 * 1000 + 12 * 60 * 1000)).toBe('3h 12m')
  })
})
```

Add to `src/lib/present.test.ts`:

```ts
  it('exposes remaining time until the size goes stale', () => {
    const now = Date.parse('2026-09-09T12:15:00.000Z')
    const row = presentTicket(
      ticket({
        size: 'S',
        labels: ['status:in-flight'],
        commentCount: 1,
        hasLinkedPr: true,
      }),
      now,
    )
    expect(row.remainingMs).toBe(30 * 60 * 1000)
  })

  it('orders the same heat by closest to stale', () => {
    const now = Date.parse('2026-09-09T12:20:00.000Z')
    const later = presentTicket(
      ticket({
        id: 'later',
        number: 2,
        size: 'L',
        labels: ['status:in-flight'],
        commentCount: 1,
        hasLinkedPr: true,
      }),
      now,
    )
    const sooner = presentTicket(
      ticket({
        id: 'sooner',
        number: 3,
        size: 'S',
        labels: ['status:in-flight'],
        commentCount: 1,
        hasLinkedPr: true,
      }),
      now,
    )
    expect(sortPresented([later, sooner]).map((r) => r.ticket.id)).toEqual([
      'sooner',
      'later',
    ])
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/freshness.test.ts src/lib/format.test.ts src/lib/present.test.ts`

Expected: FAIL — `remainingToStaleMs` / `formatCountdown` missing; `remainingMs` undefined; sort still uses `freshMs` (both cooking tickets are cool, `freshMs` equal, order unstable or insertion order).

- [ ] **Step 3: Write minimal implementation**

Add to `src/lib/freshness.ts`:

```ts
export function remainingToStaleMs(ticket: Ticket, now: number): number {
  return Math.max(0, STALE_MS[ticket.size] - freshnessMs(ticket, now))
}
```

Add to `src/lib/format.ts`:

```ts
export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'late'
  const totalMinutes = Math.floor(ms / 60_000)
  if (totalMinutes < 1) return '<1m'
  return formatClock(ms)
}
```

`formatClock` still returns `'just in'` under a minute; `formatCountdown` must not call it for that bucket (the early return handles it).

Update `src/lib/present.ts`:

```ts
import { freshnessMs, heatFor, remainingToStaleMs, stateFor } from './freshness.ts'

export type PresentedTicket = {
  ticket: Ticket
  state: TicketState
  heat: Heat
  waitMs: number
  freshMs: number
  remainingMs: number
  actors: ActorRuntime[]
}

export const HEAT_RANK: Record<Heat, number> = { hot: 0, warm: 1, cool: 2 }

export function presentTicket(ticket: Ticket, now: number): PresentedTicket {
  return {
    ticket,
    state: stateFor(ticket, now),
    heat: heatFor(ticket, now),
    waitMs: Math.max(0, now - Date.parse(ticket.openedAt)),
    freshMs: freshnessMs(ticket, now),
    remainingMs: remainingToStaleMs(ticket, now),
    actors: actorsOn(ticket),
  }
}

export function sortPresented(rows: PresentedTicket[]): PresentedTicket[] {
  return [...rows].sort((a, b) => {
    const heat = HEAT_RANK[a.heat] - HEAT_RANK[b.heat]
    if (heat !== 0) return heat
    const remain = a.remainingMs - b.remainingMs
    if (remain !== 0) return remain
    return a.ticket.number - b.ticket.number
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/freshness.test.ts src/lib/format.test.ts src/lib/present.test.ts`

Expected: PASS. Existing “hot waiting ahead of cool queued” still PASS (heat rank dominates).

- [ ] **Step 5: Commit**

```bash
git add src/lib/freshness.ts src/lib/freshness.test.ts src/lib/format.ts src/lib/format.test.ts src/lib/present.ts src/lib/present.test.ts
git commit -m "feat: countdown remaining time until a ticket goes stale"
```

---

### Task 4: Pass layout (expo / line / well)

**Files:**
- Create: `src/lib/pass-layout.ts`
- Test: `src/lib/pass-layout.test.ts`

**Interfaces:**
- Consumes: `PresentedTicket`, `HEAT_RANK`, `coversFor`, `HUMAN_COVER_CAP`, `AGENT_COVER_CAP`
- Produces: `layoutPass(rows: PresentedTicket[]): PassLayout`

```ts
export type PassLayout = {
  expo: PresentedTicket[]
  line: PresentedTicket[]
  wellCount: number
  humanCovers: number
  agentCovers: number
  humanCap: number
  agentCap: number
  humanSlammed: boolean
  agentSlammed: boolean
}
```

- [ ] **Step 1: Write the failing test**

Create `src/lib/pass-layout.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { Ticket } from '../kiosk/types'
import { AGENT_COVER_CAP, HUMAN_COVER_CAP } from './covers'
import { layoutPass } from './pass-layout'
import { presentTicket } from './present'

function ticket(partial: Partial<Ticket> = {}): Ticket {
  return {
    id: '1',
    number: 1,
    kind: 'issue',
    title: 'x',
    url: 'https://example.com',
    openedAt: '2026-09-09T12:00:00.000Z',
    size: 'M',
    labels: [],
    events: [],
    ci: 'none',
    hasLinkedPr: false,
    commentCount: 0,
    ...partial,
  }
}

const T0 = Date.parse('2026-09-09T12:10:00.000Z')

function row(partial: Partial<Ticket>): ReturnType<typeof presentTicket> {
  return presentTicket(ticket(partial), T0)
}

describe('layoutPass', () => {
  it('keeps waiting and stale on expo even when the human meter is slammed', () => {
    const rows = [
      row({
        id: 'a',
        number: 1,
        size: 'XL',
        labels: ['status:needs-rob'],
      }),
      row({
        id: 'b',
        number: 2,
        size: 'XL',
        labels: ['status:needs-rob'],
      }),
      row({
        id: 'stale',
        number: 3,
        size: 'M',
        openedAt: '2026-09-09T09:00:00.000Z',
        labels: ['status:in-flight'],
        commentCount: 0,
        hasLinkedPr: false,
      }),
    ]
    const pass = layoutPass(rows)
    expect(pass.expo.map((r) => r.ticket.id)).toEqual(['stale', 'a', 'b'])
    expect(pass.humanCovers).toBe(8 + 8 + 2)
    expect(pass.humanCap).toBe(HUMAN_COVER_CAP)
    expect(pass.humanSlammed).toBe(true)
    expect(pass.expo).toHaveLength(3)
  })

  it('paints cooking until 24 covers and counts overflow in the well and on the agent meter', () => {
    const cooking = Array.from({ length: 4 }, (_, i) =>
      row({
        id: `xl-${i}`,
        number: i + 10,
        size: 'XL',
        labels: ['status:in-flight'],
        commentCount: 2,
        hasLinkedPr: true,
      }),
    )
    const queued = row({
      id: 'q',
      number: 99,
      size: 'S',
      labels: [],
    })
    const pass = layoutPass([...cooking, queued])
    expect(pass.line).toHaveLength(3)
    expect(pass.line.every((r) => r.state === 'cooking')).toBe(true)
    expect(pass.wellCount).toBe(2)
    expect(pass.agentCovers).toBe(32)
    expect(pass.agentCap).toBe(AGENT_COVER_CAP)
    expect(pass.agentSlammed).toBe(true)
    expect(pass.line.find((r) => r.ticket.id === queued.ticket.id)).toBeUndefined()
    expect(pass.expo).toHaveLength(0)
  })

  it('skips a plate that does not fit and still fills with a later smaller one', () => {
    // Rank is hottest then closest-to-stale, not input order.
    // 10×M: remaining 10m (warm). XL: remaining 20m (warm). S: remaining 30m (cool).
    const cooking = (
      partial: Partial<Ticket> & { id: string; at: string },
    ) => {
      const { at, ...rest } = partial
      return row({
        labels: ['status:in-flight'],
        commentCount: 2,
        hasLinkedPr: true,
        events: [
          {
            kind: 'commit',
            at,
            actor: 'cursor',
            label: 'commit',
          },
        ],
        ...rest,
      })
    }
    const tens = Array.from({ length: 10 }, (_, i) =>
      cooking({
        id: `m-${i}`,
        number: i + 1,
        size: 'M',
        at: '2026-09-09T10:20:00.000Z',
      }),
    )
    const banquet = cooking({
      id: 'banquet',
      number: 50,
      size: 'XL',
      at: '2026-09-09T04:30:00.000Z',
    })
    const side = cooking({
      id: 'side',
      number: 51,
      size: 'S',
      at: '2026-09-09T11:55:00.000Z',
    })
    const pass = layoutPass([banquet, side, ...tens])
    expect(pass.line.map((r) => r.ticket.id)).toContain('side')
    expect(pass.line.map((r) => r.ticket.id)).not.toContain('banquet')
    expect(pass.wellCount).toBe(1)
    expect(pass.agentCovers).toBe(20 + 8 + 1)
    expect(pass.agentSlammed).toBe(true)
  })

  it('is not slammed at exactly the cap', () => {
    const pass = layoutPass([
      row({
        id: 'xl',
        number: 1,
        size: 'XL',
        labels: ['status:needs-rob'],
      }),
    ])
    expect(pass.humanCovers).toBe(8)
    expect(pass.humanSlammed).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/pass-layout.test.ts`

Expected: FAIL — cannot find module `./pass-layout`

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/pass-layout.ts`:

```ts
import type { PresentedTicket } from './present.ts'
import { HEAT_RANK } from './present.ts'
import {
  AGENT_COVER_CAP,
  HUMAN_COVER_CAP,
  coversFor,
} from './covers.ts'

export type PassLayout = {
  expo: PresentedTicket[]
  line: PresentedTicket[]
  wellCount: number
  humanCovers: number
  agentCovers: number
  humanCap: number
  agentCap: number
  humanSlammed: boolean
  agentSlammed: boolean
}

function isExpo(row: PresentedTicket): boolean {
  return row.state === 'waiting_on_you' || row.state === 'stale'
}

function byLamp(a: PresentedTicket, b: PresentedTicket): number {
  const heat = HEAT_RANK[a.heat] - HEAT_RANK[b.heat]
  if (heat !== 0) return heat
  const remain = a.remainingMs - b.remainingMs
  if (remain !== 0) return remain
  return a.ticket.number - b.ticket.number
}

export function layoutPass(rows: PresentedTicket[]): PassLayout {
  const expo = rows.filter(isExpo).sort(byLamp)
  const cooking = rows.filter((row) => row.state === 'cooking').sort(byLamp)
  const queued = rows.filter((row) => row.state === 'queued')

  const line: PresentedTicket[] = []
  let used = 0
  const overflow: PresentedTicket[] = []
  for (const row of cooking) {
    const cost = coversFor(row.ticket.size)
    if (used + cost <= AGENT_COVER_CAP) {
      line.push(row)
      used += cost
    } else {
      overflow.push(row)
    }
  }

  const humanCovers = expo.reduce(
    (sum, row) => sum + coversFor(row.ticket.size),
    0,
  )
  const agentCovers = cooking.reduce(
    (sum, row) => sum + coversFor(row.ticket.size),
    0,
  )

  return {
    expo,
    line,
    wellCount: queued.length + overflow.length,
    humanCovers,
    agentCovers,
    humanCap: HUMAN_COVER_CAP,
    agentCap: AGENT_COVER_CAP,
    humanSlammed: humanCovers > HUMAN_COVER_CAP,
    agentSlammed: agentCovers > AGENT_COVER_CAP,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/pass-layout.test.ts`

Expected: PASS. If the skip-fit test fails, fix timestamps so 10×M sort first, then XL, then S, with 20 covers already on the line before XL is considered.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pass-layout.ts src/lib/pass-layout.test.ts
git commit -m "feat: split the pass into expo, capped line, and well count"
```

---

### Task 5: Chit — size, countdown, kitchen chips

**Files:**
- Modify: `src/components/HeatClock.tsx`
- Modify: `src/components/Ticket.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `PresentedTicket.remainingMs`, `formatCountdown`, `kitchenChip`, `ticket.size`, `ticket.kind`
- Produces: Ticket button `data-size={ticket.size}`; loud clock uses `formatCountdown(remainingMs)` labeled `walk`; secondary clock `formatClock(waitMs)` labeled `open`; chip row `.ticket-chips` with kind, size letter, optional kitchen status; `ActorChip` unchanged; last-progress label removed from the card.

HeatClock gains `format?: (ms: number) => string` defaulting to `formatClock`.

- [ ] **Step 1: Write the failing test**

Create `src/components/Ticket.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TicketCard } from '@/components/Ticket'
import type { Ticket } from '@/kiosk/types'
import { presentTicket } from '@/lib/present'

function ticket(partial: Partial<Ticket> = {}): Ticket {
  return {
    id: '1',
    number: 12,
    kind: 'pr',
    title: 'Sized chit',
    url: 'https://example.com',
    openedAt: '2026-09-09T12:00:00.000Z',
    size: 'L',
    labels: ['status:needs-rob', 'status:in-flight'],
    events: [],
    ci: 'none',
    hasLinkedPr: true,
    commentCount: 1,
    ...partial,
  }
}

describe('TicketCard', () => {
  it('exposes size, counts down to stale, and prints one kitchen chip', () => {
    const now = Date.parse('2026-09-09T12:15:00.000Z')
    const row = presentTicket(ticket(), now)
    const { container } = render(
      <TicketCard row={row} onOpen={() => undefined} />,
    )
    const chit = container.querySelector('.ticket')
    expect(chit).toHaveAttribute('data-size', 'L')
    expect(screen.getByText('walk')).toBeInTheDocument()
    expect(screen.getByText('3h 45m')).toBeInTheDocument()
    expect(screen.getByText('open')).toBeInTheDocument()
    expect(screen.getByText('PR')).toBeInTheDocument()
    expect(screen.getByText('L')).toBeInTheDocument()
    expect(screen.getByText('needs-rob')).toBeInTheDocument()
    expect(screen.queryByText('in-flight')).not.toBeInTheDocument()
  })
})
```

L budget is 4h; 15m elapsed → `3h 45m` if `formatCountdown` matches `formatClock` hour buckets.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Ticket.test.tsx`

Expected: FAIL — no `data-size`, no `walk` / `PR` / `needs-rob`.

- [ ] **Step 3: Write minimal implementation**

`src/components/HeatClock.tsx`:

```tsx
import { formatClock } from '@/lib/format'
import { cn } from '@/lib/utils'

export function HeatClock({
  ms,
  label,
  hot = false,
  format = formatClock,
}: {
  ms: number
  label: string
  hot?: boolean
  format?: (ms: number) => string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] tracking-[0.18em] text-ink-soft uppercase">
        {label}
      </span>
      <span
        className={cn(
          'font-clock text-2xl leading-none tabular-nums',
          hot ? 'text-heat-hot' : 'text-ink',
        )}
      >
        {format(ms)}
      </span>
    </div>
  )
}
```

Replace the clocks + chip block in `src/components/Ticket.tsx`. Keep tilt, perforation, title, state mark. On the root button add `data-size={ticket.size}`. Loud clock first:

```tsx
import { ActorChip } from '@/components/ActorChip'
import { HeatClock } from '@/components/HeatClock'
import { STATE_LABEL } from '@/lib/freshness'
import { formatCountdown } from '@/lib/format'
import { kitchenChip } from '@/lib/labels'
import type { PresentedTicket } from '@/lib/present'
import { cn } from '@/lib/utils'

function tiltFor(id: string): string {
  let n = 0
  for (const ch of id) n = (n + ch.charCodeAt(0)) % 11
  return `${(n - 5) * 0.18}deg`
}

const STATE_MARK: Record<string, string> = {
  queued: '○ queued',
  cooking: '◌ cooking',
  waiting_on_you: '● waiting on you',
  stale: '▲ stale',
}

export function TicketCard({
  row,
  onOpen,
}: {
  row: PresentedTicket
  onOpen: (row: PresentedTicket) => void
}) {
  const { ticket, state, heat, waitMs, remainingMs, actors } = row
  const status = kitchenChip(ticket.labels)
  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      style={{ ['--tilt' as string]: tiltFor(ticket.id) }}
      data-heat={heat}
      data-size={ticket.size}
      className={cn(
        'ticket relative flex h-full w-full flex-col gap-4 rounded-sm bg-paper p-4 text-left text-ink',
        heat === 'hot' && 'ring-2 ring-heat',
        heat === 'warm' && 'ring-1 ring-lamp/80',
      )}
    >
      <div className="ticket-perforation absolute inset-x-0 top-0 h-3 opacity-80" />
      <div className="mt-2 flex items-start justify-between gap-3">
        <p
          className="font-display text-[15px] leading-snug font-semibold tracking-tight line-clamp-2"
          title={ticket.title}
        >
          <span className="mr-2 font-clock text-xs font-normal text-ink-soft">
            #{ticket.number}
          </span>
          {ticket.title}
        </p>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 font-clock text-[10px] tracking-[0.12em] uppercase',
            heat === 'hot'
              ? 'bg-heat text-field'
              : heat === 'warm'
                ? 'bg-lamp/30 text-ink'
                : 'bg-black/5 text-ink-soft',
          )}
        >
          {STATE_MARK[state] ?? STATE_LABEL[state]}
        </span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <HeatClock
          ms={remainingMs}
          label="walk"
          hot={heat === 'hot'}
          format={formatCountdown}
        />
        <HeatClock ms={waitMs} label="open" />
      </div>
      <div className="ticket-chips flex flex-wrap items-center gap-1.5">
        {actors.length === 0 || actors.every((a) => a === 'unknown') ? (
          <ActorChip runtime="unknown" />
        ) : (
          actors
            .filter((a) => a !== 'unknown')
            .map((runtime) => (
              <ActorChip key={runtime} runtime={runtime} compact />
            ))
        )}
        <span className="rounded-full bg-black/5 px-2 py-0.5 font-clock text-[10px] tracking-[0.12em] text-ink-soft uppercase">
          {ticket.kind === 'pr' ? 'PR' : 'issue'}
        </span>
        <span className="rounded-full bg-black/5 px-2 py-0.5 font-clock text-[10px] tracking-[0.12em] text-ink-soft uppercase">
          {ticket.size}
        </span>
        {status ? (
          <span className="rounded-full bg-black/5 px-2 py-0.5 font-clock text-[10px] tracking-[0.12em] text-ink-soft uppercase">
            {status}
          </span>
        ) : null}
      </div>
    </button>
  )
}
```

Append to `src/index.css`:

```css
.ticket[data-size="S"] {
  min-height: 9rem;
}
.ticket[data-size="M"] {
  min-height: 11rem;
}
.ticket[data-size="L"] {
  min-height: 13rem;
}
.ticket[data-size="XL"] {
  min-height: 16rem;
}

.pass-expo {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.pass-expo > .ticket[data-size="S"] {
  width: 10rem;
}
.pass-expo > .ticket[data-size="M"] {
  width: 16rem;
}
.pass-expo > .ticket[data-size="L"] {
  width: 24rem;
}
.pass-expo > .ticket[data-size="XL"] {
  width: min(36rem, 100%);
}

.pass-line {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 1rem;
}
.pass-line > .ticket[data-size="S"] {
  grid-column: span 1;
}
.pass-line > .ticket[data-size="M"] {
  grid-column: span 2;
}
.pass-line > .ticket[data-size="L"] {
  grid-column: span 3;
}
.pass-line > .ticket[data-size="XL"] {
  grid-column: span 6;
}

html[data-distance="10ft"] .ticket-chips {
  display: none;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/Ticket.test.tsx src/components/Kiosk.test.tsx`

Expected: Ticket PASS. Existing Kiosk tests still PASS (they look up titles and GitHub links, not clocks).

- [ ] **Step 5: Commit**

```bash
git add src/components/HeatClock.tsx src/components/Ticket.tsx src/components/Ticket.test.tsx src/index.css
git commit -m "feat: size the chit and count down to stale"
```

---

### Task 6: Expo strip, sized line, well count, cover meters

**Files:**
- Create: `src/components/CoverMeter.tsx`
- Modify: `src/components/Rail.tsx`
- Create: `src/components/Rail.test.tsx`
- Modify: `src/components/Kiosk.tsx`
- Modify: `src/components/Kiosk.test.tsx`

**Interfaces:**
- Consumes: `layoutPass(rows)`
- Produces: default expo layout = expo strip + `.pass-line` + `{wellCount} in the well`; header two `CoverMeter`s (`expo`, `line`); pits/stations still group **all** visible rows (queued stays visible there); meters always come from `layoutPass` even on pits/stations.

Empty rule for expo layout: `EmptyPass` only when expo, line, **and** wellCount are all empty. A well-only board shows the count, not “The pass is clear.”

Demo fixtures (before magic tear): expo covers 8 (needs-rob L=4, abandoned stale M=2, copilot green-CI PR M=2), line covers 5 (cursor S + claude L), well 1 (queued). After 8s, magic-tear S lands on expo → human 9, slammed.

- [ ] **Step 1: Write the failing tests**

Create `src/components/Rail.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Rail } from '@/components/Rail'
import type { Ticket } from '@/kiosk/types'
import { presentTicket } from '@/lib/present'

function ticket(partial: Partial<Ticket> = {}): Ticket {
  return {
    id: '1',
    number: 1,
    kind: 'issue',
    title: 'Queued only',
    url: 'https://example.com',
    openedAt: '2026-09-09T12:00:00.000Z',
    size: 'S',
    labels: [],
    events: [],
    ci: 'none',
    hasLinkedPr: false,
    commentCount: 0,
    ...partial,
  }
}

describe('Rail expo layout', () => {
  it('does not call the pass clear when the well has tickets', () => {
    const now = Date.parse('2026-09-09T12:10:00.000Z')
    const rows = [presentTicket(ticket(), now)]
    render(<Rail rows={rows} layout="expo" onOpen={() => undefined} />)
    expect(screen.getByText(/1 in the well/i)).toBeInTheDocument()
    expect(screen.queryByText(/The pass is clear/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Queued only/i)).not.toBeInTheDocument()
  })

  it('puts waiting tickets in the expo strip and sizes the line', () => {
    const now = Date.parse('2026-09-09T12:10:00.000Z')
    const waiting = presentTicket(
      ticket({
        id: 'w',
        number: 2,
        title: 'Needs a click',
        labels: ['status:needs-rob'],
        size: 'S',
      }),
      now,
    )
    const cooking = presentTicket(
      ticket({
        id: 'c',
        number: 3,
        title: 'Agent plate',
        kind: 'pr',
        size: 'XL',
        labels: ['status:in-flight'],
        hasLinkedPr: true,
        commentCount: 2,
        ci: 'pending',
      }),
      now,
    )
    const { container } = render(
      <Rail rows={[waiting, cooking]} layout="expo" onOpen={() => undefined} />,
    )
    expect(container.querySelector('.pass-expo')?.querySelector('[data-size="S"]')).toBeTruthy()
    expect(container.querySelector('.pass-line')?.querySelector('[data-size="XL"]')).toBeTruthy()
    expect(screen.getByText(/Needs a click/i)).toBeInTheDocument()
    expect(screen.getByText(/Agent plate/i)).toBeInTheDocument()
  })
})
```

Add to `src/components/Kiosk.test.tsx` (keep magic-tear and dialog tests):

```tsx
  it('shows expo/line cover meters and a well count on the demo pass', () => {
    render(
      <Kiosk
        tickets={demoTickets}
        owner="fuseon-connections"
        repo="fuse-on-v2"
        demo
      />,
    )
    expect(screen.getByText('8 / 8')).toBeInTheDocument()
    expect(screen.getByText('5 / 24')).toBeInTheDocument()
    expect(screen.getByText(/1 in the well/i)).toBeInTheDocument()
    expect(
      screen.queryByText(/Document the heartbeat snippet/i),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/hot on the pass/i)).not.toBeInTheDocument()
  })
```

Demo math (do not change fixtures to make this pass): needs-rob L=4 + abandoned stale M=2 + copilot green-CI waiting M=2 → expo `8 / 8`. cursor S=1 + claude L=4 → line `5 / 24`. queued → `1 in the well`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/Rail.test.tsx src/components/Kiosk.test.tsx`

Expected: FAIL — no well copy, still “hot on the pass”, queued title still painted on the expo grid.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/CoverMeter.tsx`:

```tsx
import { cn } from '@/lib/utils'

export function CoverMeter({
  label,
  used,
  cap,
  slammed,
}: {
  label: string
  used: number
  cap: number
  slammed: boolean
}) {
  return (
    <div className="text-right">
      <p
        className={cn(
          'font-clock text-3xl tabular-nums',
          slammed ? 'text-heat' : 'text-paper',
        )}
      >
        {used} / {cap}
      </p>
      <p className="text-[11px] tracking-[0.18em] text-paper/45 uppercase">
        {label}
        {slammed ? ' · slammed' : ''}
      </p>
    </div>
  )
}
```

Replace expo branch in `src/components/Rail.tsx` (keep pits/stations as they are, still mapping **all** `rows`). Import `layoutPass` and `EmptyPass`:

```tsx
import { EmptyPass } from '@/components/EmptyPass'
import { TicketCard } from '@/components/Ticket'
import type { LayoutId } from '@/kiosk/types'
import { layoutPass } from '@/lib/pass-layout'
import type { PresentedTicket } from '@/lib/present'
import { cn } from '@/lib/utils'

function groupByStation(rows: PresentedTicket[]) {
  const groups = new Map<string, PresentedTicket[]>()
  for (const row of rows) {
    const key = row.ticket.runtime ?? 'unknown'
    const list = groups.get(key) ?? []
    list.push(row)
    groups.set(key, list)
  }
  return groups
}

export function Rail({
  rows,
  layout,
  onOpen,
}: {
  rows: PresentedTicket[]
  layout: LayoutId
  onOpen: (row: PresentedTicket) => void
}) {
  if (layout === 'pits') {
    const waiting = rows.filter(
      (r) => r.state === 'waiting_on_you' || r.state === 'stale',
    )
    const cooking = rows.filter(
      (r) => r.state === 'cooking' || r.state === 'queued',
    )
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Pit title="Waiting" hint="Needs a click" rows={waiting} onOpen={onOpen} />
        <Pit title="Cooking" hint="In motion" rows={cooking} onOpen={onOpen} />
      </div>
    )
  }

  if (layout === 'stations') {
    const groups = groupByStation(rows)
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...groups.entries()].map(([station, list]) => (
          <div key={station} className="min-w-[260px] flex-1">
            <h2 className="mb-3 font-clock text-[11px] tracking-[0.2em] text-paper/50 uppercase">
              {station}
            </h2>
            <div className="flex flex-col gap-3">
              {list.map((row) => (
                <TicketCard key={row.ticket.id} row={row} onOpen={onOpen} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const pass = layoutPass(rows)
  if (
    pass.expo.length === 0 &&
    pass.line.length === 0 &&
    pass.wellCount === 0
  ) {
    return <EmptyPass />
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <header className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-lg">Expo</h2>
          <p className="font-clock text-[11px] tracking-[0.16em] text-paper/45 uppercase">
            Walk these
          </p>
        </header>
        {pass.expo.length === 0 ? (
          <p className="text-sm text-paper/50">Nothing under the lamp.</p>
        ) : (
          <div className="pass-expo">
            {pass.expo.map((row) => (
              <TicketCard key={row.ticket.id} row={row} onOpen={onOpen} />
            ))}
          </div>
        )}
      </section>
      <section>
        <header className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-lg">Line</h2>
          <p className="font-clock text-[11px] tracking-[0.16em] text-paper/45 uppercase">
            On the fire
          </p>
        </header>
        {pass.line.length === 0 ? (
          <p className="text-sm text-paper/50">No tickets on the line.</p>
        ) : (
          <div className="pass-line">
            {pass.line.map((row) => (
              <TicketCard key={row.ticket.id} row={row} onOpen={onOpen} />
            ))}
          </div>
        )}
      </section>
      <p className="font-clock text-sm tracking-[0.08em] text-paper/45">
        {pass.wellCount} in the well
      </p>
    </div>
  )
}

function Pit({
  title,
  hint,
  rows,
  onOpen,
}: {
  title: string
  hint: string
  rows: PresentedTicket[]
  onOpen: (row: PresentedTicket) => void
}) {
  return (
    <section>
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-lg">{title}</h2>
        <p className="font-clock text-[11px] tracking-[0.16em] text-paper/45 uppercase">
          {hint}
        </p>
      </header>
      <div className={cn('flex flex-col gap-3', rows.length === 0 && 'opacity-40')}>
        {rows.length === 0 ? (
          <p className="text-sm text-paper/50">None.</p>
        ) : (
          rows.map((row) => (
            <TicketCard key={row.ticket.id} row={row} onOpen={onOpen} />
          ))
        )}
      </div>
    </section>
  )
}
```

In `src/components/Kiosk.tsx`:

- Import `layoutPass` and `CoverMeter`.
- After `rows` memo, `const pass = useMemo(() => layoutPass(rows), [rows])`.
- Replace the hot-count header block with:

```tsx
        <div className="flex items-end gap-6">
          <CoverMeter
            label="expo"
            used={pass.humanCovers}
            cap={pass.humanCap}
            slammed={pass.humanSlammed}
          />
          <CoverMeter
            label="line"
            used={pass.agentCovers}
            cap={pass.agentCap}
            slammed={pass.agentSlammed}
          />
        </div>
```

Delete `hotCount`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/Rail.test.tsx src/components/Kiosk.test.tsx src/pages/RepoBoardPage.test.tsx`

Expected: PASS. Magic tear: after 8s the needs-rob S appears on expo; the title assertion still works. Expo meter becomes `9 / 8` with `slammed` after the tear — do not assert that in the new test (it runs without advancing 8s).

Magic tear: after 8s the needs-rob S appears on expo; title assertion still works.

- [ ] **Step 5: Commit**

```bash
git add src/components/CoverMeter.tsx src/components/Rail.tsx src/components/Rail.test.tsx src/components/Kiosk.tsx src/components/Kiosk.test.tsx
git commit -m "feat: expo strip, capped line, well count, and cover meters"
```

---

### Task 7: Keep the last live board

**Files:**
- Modify: `src/pages/RepoBoardPage.tsx`
- Modify: `src/pages/RepoBoardPage.test.tsx`

**Interfaces:**
- Consumes: existing `/api/board/:owner/:repo` poll
- Produces: on fetch failure, `setTickets` is a no-op if tickets were already painted. First failure still empty pass. Never assign `demoTickets`.

- [ ] **Step 1: Write the failing test**

Add `act` to the Testing Library import. Add this test inside the existing `describe`:

```tsx
  it('keeps the last live board when a later poll fails', async () => {
    const liveTicket = {
      id: '1',
      number: 7,
      kind: 'issue' as const,
      title: 'Heat the pass',
      url: 'https://github.com/acme/widgets/issues/7',
      openedAt: new Date().toISOString(),
      size: 'S' as const,
      labels: ['status:needs-rob'],
      events: [],
      ci: 'none' as const,
      hasLinkedPr: false,
      commentCount: 0,
      runtime: 'unknown' as const,
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          owner: 'acme',
          repo: 'widgets',
          tickets: [liveTicket],
        }),
      })
      .mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'github down' }),
      })
    vi.stubGlobal('fetch', fetchMock)
    vi.useFakeTimers()
    renderBoard('/acme/widgets')
    expect(await screen.findByText(/Heat the pass/i)).toBeInTheDocument()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000)
    })
    expect(screen.getByText(/Heat the pass/i)).toBeInTheDocument()
    expect(
      screen.queryByText(/Merge-queue attestation/i),
    ).not.toBeInTheDocument()
    vi.useRealTimers()
  })
```

`afterEach` already calls `vi.unstubAllGlobals()`. Add `vi.useRealTimers()` there too so a failure in this test cannot leak fake timers into the rest of the file.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/RepoBoardPage.test.tsx`

Expected: FAIL — catch path `setTickets([])` clears “Heat the pass” after the second fetch, empty pass appears.

- [ ] **Step 3: Write minimal implementation**

In `src/pages/RepoBoardPage.tsx` catch:

```tsx
        .catch(() => {
          if (cancelled) return
          setDemo(false)
        })
```

Do not call `setTickets([])` on error. Initial state is already `[]`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/pages/RepoBoardPage.test.tsx`

Expected: PASS, including “does not paint demo fixtures when the board API has no snapshot”.

- [ ] **Step 5: Commit**

```bash
git add src/pages/RepoBoardPage.tsx src/pages/RepoBoardPage.test.tsx
git commit -m "fix: keep the last live board when a poll fails"
```

---

### Task 8: Design gallery + full suite

**Files:**
- Modify: `src/pages/DesignSystem.tsx`
- Create: `src/pages/DesignSystem.test.tsx`

**Interfaces:**
- Consumes: `TicketCard`, `presentTicket`, `formatCountdown`, `HeatClock`
- Produces: a “Covers” section with four sized chits (S/M/L/XL) in `.pass-line` and a countdown clock labeled `walk`

- [ ] **Step 1: Write the failing test**

Create `src/pages/DesignSystem.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DesignPage } from '@/pages/DesignSystem'

describe('DesignPage', () => {
  it('shows sized cover examples and a countdown clock', () => {
    render(<DesignPage />)
    expect(screen.getByRole('heading', { name: 'Covers' })).toBeInTheDocument()
    expect(screen.getByText('Side (S)')).toBeInTheDocument()
    expect(screen.getByText('Plate (M)')).toBeInTheDocument()
    expect(screen.getByText('Board (L)')).toBeInTheDocument()
    expect(screen.getByText('Banquet (XL)')).toBeInTheDocument()
    expect(screen.getByText('walk')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/DesignSystem.test.tsx`

Expected: FAIL — no “Covers” heading.

- [ ] **Step 3: Write minimal implementation**

In `src/pages/DesignSystem.tsx`, import `formatCountdown` from `@/lib/format`. After the existing Ticket section, add:

```tsx
      <section className="mt-12">
        <h2 className="font-display text-xl">Covers</h2>
        <p className="mt-2 text-sm text-paper/60">
          S is a side. XL is a banquet. The loud clock counts down to stale.
        </p>
        <div className="pass-line mt-4">
          {(
            [
              ['S', 'Side (S)'],
              ['M', 'Plate (M)'],
              ['L', 'Board (L)'],
              ['XL', 'Banquet (XL)'],
            ] as const
          ).map(([size, title], index) => (
            <TicketCard
              key={size}
              row={presentTicket(
                {
                  ...(demoTickets.find((t) => t.id === 'cursor-live') ??
                    demoTickets[2]),
                  id: `cover-${size}`,
                  number: 500 + index,
                  size,
                  title,
                },
                now,
              )}
              onOpen={() => undefined}
            />
          ))}
        </div>
        <div className="mt-6 rounded-md bg-paper p-4 text-ink">
          <HeatClock
            ms={12 * 60 * 1000}
            label="walk"
            format={formatCountdown}
          />
        </div>
      </section>
```

- [ ] **Step 4: Run the full suite and typecheck**

Run:

```bash
npx vitest run
npx tsc -b
```

Expected: all tests PASS; `tsc` exits 0. Fix any `PresentedTicket` object literals missing `remainingMs`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/DesignSystem.tsx src/pages/DesignSystem.test.tsx
git commit -m "docs: show sized chits and countdown on /design"
```

---

## Spec coverage (self-review)

| Spec item | Task |
| --- | --- |
| Covers 1/2/4/8, caps 8 and 24 | 1 |
| Label wins; infer unlabeled; thresholds | 2 |
| Countdown to stale by size; late lamp | 3, 5 |
| Expo always painted; human meter; stale on expo | 4, 6 |
| Line greedy fill 24; overflow counts; well count | 4, 6 |
| Header two meters; slammed word + heat color | 6 |
| Sized chits; 10ft drops chips | 5 |
| Chips: PR/issue, size, one status | 2 (`kitchenChip`), 5 |
| Client present; no new store | 4–6 |
| Live no fixture fallback; keep last board | 7 |
| `/design` sized examples | 8 |
| File-count, well drill-in, editable caps, Marketplace, fuse-on-v2, Layer B, check-runs | out of scope (Global Constraints) |

## Placeholder scan

No TBD. Inference thresholds, copy (`expo`, `line`, `{n} in the well`, ` · slammed`, clock labels `walk` / `open`), CSS spans, and webhook size-merge rule are locked above.

## Type consistency

- `sizeFromLabels` → `Size | null` everywhere; `sizeForTicket` is the mapper entry.
- `PresentedTicket.remainingMs` is required after Task 3.
- `HEAT_RANK` is exported from `present.ts` and imported by `pass-layout.ts`.
- `PassLayout.humanCovers` / `agentCovers` feed `CoverMeter.used`.
- `kitchenChip` lives in `labels.ts`, not a second parser in `Ticket.tsx`.
