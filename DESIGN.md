---
name: The Pass
description: Kitchen display for GitHub issues and PRs.
colors:
  field: "#100e0c"
  field-2: "#1c1814"
  steel: "#3d362e"
  paper: "#f3ead7"
  paper-2: "#e7d9bf"
  ink: "#1c140c"
  heat: "#ff5a1f"
  heat-hot: "#ff2d2d"
  lamp: "#ffb347"
  cool: "#7a9e8a"
typography:
  display:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 600
  clock:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontFeature: "tabular-nums"
    roles: "wait clock and freshness clock"
rounded:
  ticket: "2px"
  chip: "9999px"
  frame: "6px"
---

# Design

## Overview

A quiet expensive pass window. Paper tickets tear onto the rail. The only loud thing is heat on tickets that wait on you or go stale.

## Color

Field is warm black. Tickets are thermal paper. **One** heat color (amber→red lamp). Actor chips may use lamp/paper/cool as identity marks, not as status.

## Typography

Sora for titles. IBM Plex Mono for clocks. 2ft default. 10ft via `?distance=10ft`.

## Motion (whitelisted)

- Printer-tear entrance ~380ms.
- Heat pulse 1.2s **only** on waiting/stale.
- Honor `prefers-reduced-motion` by dropping animation; keep label + mark.
- Sound off.

## Components

Ticket, Rail, HeatClock, ActorChip, EmptyPass. shadcn/Radix for Button, Badge, Dialog, Tooltip chrome only.

## Layouts

expo (default), pits, stations. Shotgun files live at `/shotgun/expo.html`, `/shotgun/pits.html`, `/shotgun/stations.html`. Production kiosk defaults to expo.

## Do

Pair every heat color with a word and a mark (○ queued, ◌ cooking, ● waiting, ▲ stale).

## Don't

Rainbow status. Nested dashboard cards. Chat panes on the wall. Inter-as-brand. Fuse On orange.
