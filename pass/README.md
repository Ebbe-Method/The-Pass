# The Pass wall

Rails 8 Hotwire kiosk. The Vite app at the repo root stays the behavior reference.

## Look at it

```bash
cd pass
bin/rails db:prepare
bin/dev
```

Open http://localhost:3000 for the fixture wall. A stored board is at `/:owner/:repo` (for example `/fuseon-connections/fuse-on-v2`).

## Tests

```bash
cd pass
bin/rails test
```

## GitHub credentials

Development reads these keys from the environment or from Rails credentials (`bin/rails credentials:edit`):

```yaml
GITHUB_APP_ID: ""
GITHUB_APP_PRIVATE_KEY: |
  -----BEGIN RSA PRIVATE KEY-----
  ...
  -----END RSA PRIVATE KEY-----
GITHUB_WEBHOOK_SECRET: ""
GITHUB_INSTALLATION_ID: ""
```

Paste the private key with real newlines, or as a single string with `\n` escapes. Without them, `/` still shows the demo wall and `/:owner/:repo` shows the last board saved in SQLite.
