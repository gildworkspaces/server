# gild server

The self-hosted gild forge backend — a single Rust binary that plays the role
Cloudflare plays for gild.gg: bare git repositories on disk, smart-HTTP, the
forge API the web app talks to, sqlite live buffers, the CI queue.

```sh
gild-server init    # set up the forge data directory
gild-server serve   # (lands next) serve git + the forge API
```

Self-hosting is the private-repos path: same metadata model (`_meta` branch),
same identity (keys, claims, delegations) as gild.gg, nothing public unless
you expose it. Published on npm as `@gildforge/server` with per-platform
binaries.
