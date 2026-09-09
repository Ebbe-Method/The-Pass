# Heartbeat snippet (Layer B)

Paste this HTML comment in an issue or PR body (or a dedicated comment) so The Pass can show who is on the ticket and the session deep link.

```html
<!-- kitchen:claim runtime="cursor" session="https://cursor.com/agents/bc-…" -->
```

`runtime` values: `cursor`, `claude`, `copilot`, `bot`.

If the comment is missing, The Pass shows an empty actor chip and the card click goes to GitHub. It does not guess.

Do not patch fuse-on-v2 first. Copy this file into the consuming repo when you are ready.
