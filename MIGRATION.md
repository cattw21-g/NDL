# Nerfed Demonlist — Migration from Netlify to Cloudflare Workers

## Overview
This Next.js 16.2.6 application has been migrated from Netlify to **Cloudflare Workers** using `@opennextjs/cloudflare`. The migration eliminates Netlify credit exhaustion and site pausing, running entirely within Cloudflare's free tier with zero recurring host costs.

The site is currently live at:
**https://nerfeddemonlist.ndl-app.workers.dev**

---

## Architectural & Technical Changes

### 1. Cloudflare Workers Adapter (`@opennextjs/cloudflare`)
- Installed `@opennextjs/cloudflare` and `wrangler`.
- Configured `open-next.config.ts` using `defineCloudflareConfig()`.
- Created `wrangler.jsonc` targeting `.open-next/worker.js`, binding static assets from `.open-next/assets`, and enabling `nodejs_compat` with compatibility date `2025-01-01`.
- Configured `public/_headers` for immutable 1-year caching of `/_next/static/*` assets on Cloudflare's CDN.

### 2. Prisma 7 with `workerd` & Neon Serverless Driver
- Cloudflare Workers V8 isolates forbid dynamic WASM code compilation (`new WebAssembly.Module`).
- Configured `prisma/schema.prisma` with `runtime = "workerd"` so Prisma compiles query engine WASM statically as ES modules.
- Updated `src/lib/db.ts` to:
  1. Use `@prisma/adapter-neon` (`new PrismaNeon({ connectionString })`) over `@neondatabase/serverless` for optimal connection pooling and lifecycle management without hanging TCP sockets.
  2. Scope `PrismaClient` per-request using React's `cache()` to strictly obey Cloudflare Workers' request I/O isolation boundary (`Cannot perform I/O on behalf of a different request`).
  3. Wrap `prisma` in a lazy Proxy so secrets are evaluated at invocation time.

### 3. External Database & Services Integrity
- **PostgreSQL**: Points to the existing external Neon database (`ep-red-morning-app0tfbz-pooler.c-7.us-east-1.aws.neon.tech/neondb`). No schema migrations were run, preserving all data intact.
- **Vercel Blob**: Continues to operate via external REST API without modifications.
- **Discord Bot**: The persistent gateway bot process (`bot/src/index.ts`) is separated from the serverless edge worker and remains runnable via `npm run bot:start`.

### 4. Build & Deployment Scripts
The following npm scripts are configured in `package.json`:
- `npm run build:worker`: Builds the Next.js app and bundles the Cloudflare Worker via OpenNext.
- `npm run preview:worker`: Builds and runs a local Cloudflare Worker preview with Wrangler.
- `npm run deploy:worker`: Builds and deploys the Worker and static assets directly to Cloudflare.
- Or simply: `npm run build:worker` followed by `npx wrangler deploy`.

---

## Environment Variables & Secrets
All 16 production environment variables and secrets were uploaded and bound to the Cloudflare Worker `nerfeddemonlist`:
- `DATABASE_URL`
- `SESSION_SECRET`
- `BLOB_STORE_ID`
- `BLOB_READ_WRITE_TOKEN`
- `DISCORD_APPLICATION_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_BOT_TOKEN`
- `DISCORD_GUILD_ID`
- `DISCORD_OWNER_ID`
- `DISCORD_NOTIFY_MENTION`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_SECURE`
- `SMTP_FROM`

Plain environment variables in `wrangler.jsonc`:
- `APP_URL`: `https://www.nerfeddemonlist.net`
- `NEXT_PUBLIC_SITE_URL`: `https://www.nerfeddemonlist.net`

---

## Owner Steps to Complete Custom Domain Setup

Follow these remaining steps in the Cloudflare Dashboard to finish routing the domain:

### Step 1: Add `nerfeddemonlist.net` to Cloudflare & Update Namecheap Nameservers
1. Log into your Cloudflare Dashboard (dash.cloudflare.com).
2. Click **Add a domain** (or **Add site**).
3. Enter `nerfeddemonlist.net` and select the **Free Plan** ($0).
4. Cloudflare will provide two nameservers (e.g. `*.ns.cloudflare.com`).
5. Log into Namecheap, open `nerfeddemonlist.net` Domain Management &rarr; Nameservers &rarr; Select **Custom DNS**, and paste the two Cloudflare nameservers (exactly like you did for `vaurne.xyz`).

### Step 2: Attach Custom Domains to the Worker
Once the domain zone becomes active in Cloudflare:
1. In the Cloudflare Dashboard, go to **Compute (Workers & Pages)** &rarr; Click **`nerfeddemonlist`**.
2. Go to **Settings** &rarr; **Domains & Routes** &rarr; Click **Add**.
3. Select **Custom Domain**:
   - Add `nerfeddemonlist.net`
   - Add `www.nerfeddemonlist.net`
4. Cloudflare will automatically provision free edge SSL/TLS certificates and point DNS traffic directly to the Worker.

### Step 3: Done!
Once attached, both `https://nerfeddemonlist.net` and `https://www.nerfeddemonlist.net` will serve the site worldwide with zero risk of Netlify pausing or running out of free credits.
