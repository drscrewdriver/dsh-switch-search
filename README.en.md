<p align="center">
  <strong>Session-search toggle: one switch — from your existing session title search, locate past sessions by the keywords you type and by content/summary keywords</strong>
</p>
<p align="center">
  <a href="README.md">中文</a> · <strong>English</strong>
</p>
<p align="center">
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-263146?style=flat-square"></a>
  <img alt="Public" src="https://img.shields.io/badge/status-public-7da1de?style=flat-square">
</p>

# dsh-session-search-toggle

> **One switch** lets you search historical sessions from the session search box — flip between **Title** and **Content**: filter instantly by session title, or locate past sessions across the corpus by **content / summary keywords** — no more digging to find which session said something.
>
> Implementation reuses **DSH's built-in full-text session search**, so the UI change is minimal: a **"Search"** entry at the sidebar footer whose floating panel toggles **title ↔ content** in one click.

A cordis client + host plugin assembled via the `dsh plugin` command and a bundle patch — no dsh source changes, no PR required.

## What it does

- **Title ↔ content, one switch**: one search box — "Title" filters session title / working-directory substring live; "Content" goes through DSH's built-in full-text index to search **content keywords, user questions, AI replies** inside sessions — for "I remember we once talked about X, but not which session".
- **Minimal UI footprint**: the official sidebar search box is a fixed slot that external plugins cannot replace; this plugin adds a **separate entry at the sidebar footer** (`sidebar.footer.action`) — they coexist without interfering, and the UI change stays minimal.
- **Content grouped by session**: each content result is one row (session title + strongest snippet + matched-message type tag); clicking opens that session — no per-message flood.
- **Recognizable hit types**: content results carry **User / Reply** tags, so you can tell at a glance whether the hit is a question or an answer.
- **Jump to session**: clicking a result opens that session, landing on the context around the hit (via `sessions.open`).

## UI preview

```text
┌─ Sidebar ──────────────────────────────────┐
│ ▸ Session search  （sidebar.footer.action） │
│        ┌─ Search panel (floating) ─────────┐│
│        │ [Title|Content]  [🔍 Search…]     ││
│        │ ┌─ Results ───────────────────┐   ││
│        │ │ 📄 Session title one        │   ││
│        │ │    matching snippet…        │   ││
│        │ │ 📄 Session title two · Reply │   ││
│        │ │    "…(content keyword)…"     │   ││
│        │ └─────────────────────────────┘   ││
│        └───────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

## How content search is enabled

Content mode reuses **DSH's official full-text index**, so:

1. **You must activate session content search first** (off by default). The official DSH bundle ships `session-query-sqlite` with `openAt: never` (no index is built); override it in your profile's `cordis.patch.yml` or an overlay, then restart DSH web:

   ```yaml
   - id: session-query-sqlite
     config:
       path: ':memory:'               # or a durable absolute path (survives restarts)
       openAt: first-search           # or startup
   ```

2. If your distribution offers a switch under **General settings → Default search mode**, set the default mode to **Content** and tick **activate content search**; after that content is the default, ready to search out of the box. If it is not enabled, the plugin's content mode shows concrete setup guidance; title mode is unaffected.

### ⏳ Lazy loading: the first search has to wait for the index

Historical-session content search is **lazy-indexed** — with `openAt: first-search`, the index starts building only at the **first content search**; each search then does an **incremental reconcile** (only changed sessions are rebuilt).

- On a large corpus the **first** content search is noticeably slower and may briefly return partial/no results — the background index is still building; wait a moment and search again to get correct hits.
- Once built, subsequent searches are fast; unchanged data is not rebuilt.

So if you cannot find historical content right after enabling it, **wait for the index to finish building before searching again** — it is not a malfunction.

## Installation

```sh
# Option 1: install from npm (recommended)
#   (the profile is a pnpm workspace root, so `add` needs the -w flag)
dsh plugin --profile web add dsh-session-search-toggle -w

# Option 2: assemble from git or a local path
# dsh plugin --profile web add github:drscrewdriver/dsh-session-search-toggle#release-v0.1.0   # stable
# dsh plugin --profile web add /absolute/path/to/dsh-session-search-toggle -w
#    (after a git install, build in place inside the profile's node_modules: npm install --legacy-peer-deps && npm run build)

# Confirm the compose tree contains the new line
dsh web --dump-config | grep -B1 -A2 'session-search-toggle'

# Restart dsh web — required! A running instance does not hot-load the bundle layer
dsh web
# or use the bundled script
bash ~/.dsh/profiles/web/node_modules/dsh-session-search-toggle/restart-dsh-web.sh
```

After install a **"Search"** button appears at the sidebar footer; click it to toggle between title and content search over historical sessions.

## Development

```sh
pnpm install            # includes the @deepseek-ai client chain + tsdown/tsc
pnpm typecheck          # tsc --noEmit
pnpm build              # tsc (lib/types) + tsdown (lib/index.mjs + lib/client.js)
```

### Layout

```
src/
├── index.ts            # host half (node): /session-search-toggle/api route
└── client/
    └── index.ts        # browser half: sidebar.footer.action entry + floating panel (title/content toggle)
```

- **Host half**: registers the fenced HTTP route `/session-search-toggle/api` (`list-sessions` / `content-search`), with a browser-trust fence identical to the DSH `/api` gateway (loopback Host or trustedHosts; cross-site refused).
- **Reuses the official search, no derived database**: like dsh-history, reads the live-preferred corpus through the built-in `sessionQuery` service — no official source changes, no derived database.
- **Build chain**: tsdown mirrors the harness `packages/client/tsdown.client.ts` semantics (`__ModuleLoader__.load` banner, platform externals table, bundle purity gate).
- **lib/ committed**: GitHub installs run off the committed build output (dsh does not run `prepare` on a git install); `.gitignore` does not exclude `lib/`.

## Branch map

| Branch | Purpose |
|---|---|
| `master` | Stable baseline (title ↔ content toggle, session grouping) |
| `feat/type-filter-search` | Development (content-type filter + availability probe) |
| `release-v0.1.0` | Stable installable version derived from the validated dev state, ships `lib/` |

> This project was formerly named `dsh-switch-search` and is now published as `dsh-session-search-toggle` (npm package name and plugin name updated in sync). The old name is historical only — install with the new name.

## Relation to the official sidebar search

- The official sidebar search box lives in `sidebar.workspaces` (a single slot); an external plugin **cannot replace it**. This plugin adds a **separate entry** at the sidebar footer via `sidebar.footer.action`; the two coexist.
- This plugin only adds **an extra content-search path beside title search** — turning "which session said this" from digging into a one-keyword search.

## Compatibility and privacy

- Requires DeepSeek Harness with the web profile; all data goes through the built-in `sessionQuery` service (live-preferred corpus) — **no official source changes, no derived database**.
- The panel's current mode (title/content) and input live only in the browser session's memory; nothing beyond session-search data is read or uploaded.
- Host/client contract types are declared structurally in `src/*.ts` (the npm dsh client chain is incomplete) and mirror the harness sources at build-verification time.

## License

MIT