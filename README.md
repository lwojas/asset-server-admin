# Asset Server Admin

A standalone admin UI for managing assets on the Raycaster Asset Server. This
is a management tool only — it has no knowledge of maps, entities, or
gameplay. See `docs/README.md` for the asset server's own API contract.

## Setup

```bash
npm install
cp .env.example .env   # adjust if your server URL/project differ
npm run dev
```

Configuration lives in `.env` (see `.env.example`):

```env
VITE_ASSET_SERVER_URL=http://lynn2:3002
VITE_ASSET_PROJECT=raycaster
```

## Notes

- **CORS**: the asset server currently sends no `Access-Control-Allow-Origin`
  header, so a browser can't call it directly from a different origin. In
  dev, `vite.config.js` proxies `/projects` and `/health` through the dev
  server to sidestep this. A production build talks to
  `VITE_ASSET_SERVER_URL` directly and needs the asset server (or a reverse
  proxy in front of it) to allow cross-origin requests from wherever this
  app is served.
- **Editing**: the asset server has no in-place metadata update endpoint.
  Editing an asset's key or spritesheet frame dimensions in this UI deletes
  the existing asset and re-uploads it with the new values, per the
  documented replacement workflow.

## Build

```bash
npm run build
npm run preview
```
