# NDL

NDL means Nerfed Demonlist. This project is a Next.js, Postgres, Prisma, and Tailwind web app for a moderated Geometry Dash leaderboard focused on approved nerfed versions of famous hard demons.

## Stack

- Next.js App Router with TypeScript
- Postgres via Prisma 7
- Credentials auth with hashed passwords and HTTP-only sessions
- Tailwind CSS
- Vitest unit tests

## Local Setup

PowerShell blocks `npm.ps1` on this machine, so use `npm.cmd`.

```powershell
npm.cmd install
npm.cmd run db:up
npm.cmd run db:generate
npm.cmd run db:migrate
npm.cmd run db:seed:demo
npm.cmd run dev
```

Docker is required for `db:up`. If Docker is not installed, provide a Postgres `DATABASE_URL` in `.env` and run the generate, migrate, and seed commands against that database.

`npm.cmd run db:seed` is production-safe by default and seeds only the baseline active rules document. Use `npm.cmd run db:seed:demo` only for local demo workflows because it is destructive and creates clearly labeled demo users, levels, submissions, records, and changelog content.

For production deployment, see [docs/deployment.md](docs/deployment.md).

## Environment Variables

Copy `.env.example` to `.env` for local development.

| Variable | Required | Local value | Production value |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | Local Docker Postgres URL | Production Postgres connection string |
| `NODE_ENV` | Recommended | `development` | `production` |
| `APP_URL` | Recommended | `http://localhost:3000` | Canonical app URL used in verification emails |
| `NEXT_PUBLIC_SITE_URL` | Recommended | `http://localhost:3000` | Canonical public URL, for metadata and social sharing |
| `SESSION_COOKIE_NAME` | Optional | `ndl_session` | A stable cookie name, usually `ndl_session` |
| `SESSION_SECRET` | Production required | Optional dev fallback | Strong random secret of at least 32 characters |
| `UPLOAD_MODE` | Optional | `local` for local uploads, `disabled` to hide uploads | `disabled` unless self-hosting persistent storage |
| `ALLOW_LOCAL_UPLOADS_IN_PRODUCTION` | Optional | `false` | `false` on Vercel; `true` only for intentional self-hosted local storage |
| `MAX_IMAGE_UPLOAD_MB` | Optional | `5` | Maximum local PNG/JPG/WebP upload size |
| `MAX_VIDEO_UPLOAD_MB` | Optional | `100` | Maximum local MP4 upload size |
| `PUBLIC_UPLOAD_BASE_PATH` | Optional | `/uploads` | Public URL base for local files saved under `public/uploads` |
| `BLOB_READ_WRITE_TOKEN` | Production thumbnails | Empty | Vercel Blob read/write token for admin thumbnail uploads |
| `SMTP_HOST` | Production email | Empty for console fallback | SMTP host for verification email |
| `SMTP_PORT` | Production email | `587` | SMTP port |
| `SMTP_USER` | Production email | Empty for console fallback | SMTP username, if required |
| `SMTP_PASSWORD` | Production email | Empty for console fallback | SMTP password, if required |
| `SMTP_FROM` | Production email | `Nerfed Demonlist <noreply@nerfeddemonlist.net>` | From address for verification email |
| `SMTP_REPLY_TO` | Optional | Empty | Reply-To address for verification email |
| `SMTP_SECURE` | Optional | `false` | `true` for implicit TLS, usually port 465 |
| `SMTP_DISABLE_TRACKING_HINT` | Optional | `true` | Adds a best-effort no-tracking header; disable tracking in your SMTP provider too |
| `NDL_RULES_VERSION` | Optional | `production-v1` or `demo-v1` | Release/version label for seeded baseline rules |
| `ENABLE_DEMO_SEED` | Optional | `true` only for local demo seeding | Keep unset or `false` |
| `NDL_SEED_RESET` | Optional | `true` only with local demo seeding | Keep unset or `false` |
| `ADMIN_EMAIL` | Admin bootstrap | Admin email | Admin email |
| `ADMIN_PASSWORD` | Admin bootstrap | Strong temporary password | Strong temporary password |
| `ADMIN_HANDLE` | Admin bootstrap | Admin player handle | Admin player handle |
| `ADMIN_NAME` | Admin bootstrap | Admin display name | Admin display name |
| `NDL_ADMIN_*` | Legacy admin aliases | Optional compatibility aliases | Optional compatibility aliases |

Do not commit real production secrets. `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_HANDLE` are used by `npm.cmd run db:seed` and `npm.cmd run admin:create` to create or update a verified admin account. `NDL_ADMIN_*` names remain supported for compatibility with older local instructions.

New player registrations require email verification. In development, if SMTP is not configured, NDL prints the verification link and six digit code to the terminal. In production, configure SMTP before allowing registration.

## Media Uploads

NDL keeps link-based proof as the recommended workflow. When `UPLOAD_MODE=local`, admin level forms can upload PNG/JPG/WebP thumbnails and record submissions can upload proof images. MP4 completion/raw-footage uploads are available only outside production so local moderators can test the full review flow without adding a storage provider.

Local files are written to `public/uploads/...` and served through the configured `PUBLIC_UPLOAD_BASE_PATH`, which defaults to `/uploads`. Uploaded filenames are generated by the app; original filenames are not trusted. Local filesystem uploads are not reliable for serverless production hosting because deployments can have ephemeral or read-only filesystems. Use YouTube/Drive-style proof links in production until a persistent object storage mode is added.

`public/uploads/` is ignored by git so local thumbnails and proof files are not committed. Restarting the dev server does not delete those files. Running tests uses `public/uploads-test/` so verification does not erase local uploaded thumbnails.

On Vercel production, keep `UPLOAD_MODE=disabled`. To let admins upload level thumbnails from their PC without redeploying, create a Vercel Blob store and set `BLOB_READ_WRITE_TOKEN` in Vercel. Admin thumbnail uploads then go directly to Blob and save the returned public Blob URL on the level. If the token is missing, production upload controls are disabled and admins should use a direct image URL. MP4 uploads remain disabled in production.

## Free SMTP Setup

NDL sends verification email through regular SMTP with Nodemailer. No paid email service is required, and local development keeps working without SMTP because verification links/codes are logged to the terminal.

Brevo free SMTP:

```powershell
$env:APP_URL="https://your-ndl-domain.example"
$env:SMTP_HOST="smtp-relay.brevo.com"
$env:SMTP_PORT="587"
$env:SMTP_USER="your-brevo-smtp-login"
$env:SMTP_PASSWORD="your-brevo-smtp-key"
$env:SMTP_FROM="Nerfed Demonlist <noreply@nerfeddemonlist.net>"
$env:SMTP_REPLY_TO="staff@nerfeddemonlist.net"
$env:SMTP_SECURE="false"
$env:SMTP_DISABLE_TRACKING_HINT="true"
```

Brevo documents `smtp-relay.brevo.com` as the SMTP server and notes that port 465 uses SSL/TLS; use port 587 with `SMTP_SECURE=false` unless your Brevo settings say otherwise. Inbox placement and delivery speed also depend on the verified sender/domain, SPF, DKIM, DMARC, domain reputation, recipient spam filters, and Brevo account reputation. NDL sends a minimal transactional email with a small body logo from `APP_URL/email-logo.png` when `APP_URL` is configured, but delivery delays, mailbox sender avatars, and junk-folder placement are partly outside the app's control.

Production email checklist:

- Verify the Brevo sender or sending domain before launch.
- Disable SMTP IP restriction for Vercel unless you use stable outbound IPs.
- Use `SMTP_FROM="Nerfed Demonlist <noreply@nerfeddemonlist.net>"`.
- Set `APP_URL="https://nerfeddemonlist.net"`.
- Redeploy Vercel after changing environment variables.
- Test registration and resend verification after each email setting change.
- Disable click/open tracking in Brevo settings if you do not want provider-side tracking; `SMTP_DISABLE_TRACKING_HINT=true` is only a best-effort header.

Gmail app-password SMTP:

```powershell
$env:APP_URL="https://your-ndl-domain.example"
$env:SMTP_HOST="smtp.gmail.com"
$env:SMTP_PORT="587"
$env:SMTP_USER="your-gmail-address@gmail.com"
$env:SMTP_PASSWORD="your-16-character-app-password"
$env:SMTP_FROM="NDL <your-gmail-address@gmail.com>"
$env:SMTP_SECURE="false"
```

Google requires 2-Step Verification before app passwords are available, and app passwords may be unavailable on some work, school, or Advanced Protection accounts. For port 465, set `SMTP_SECURE=true`.

References: [Brevo SMTP relay](https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP) and [Google app passwords](https://support.google.com/accounts/answer/185833?hl=en-EN).

## Seed Modes

Production-safe baseline seed:

```powershell
npm.cmd run db:seed
```

This upserts the active rules document and does not create, delete, or update custom levels, uploaded thumbnails, submissions, accepted records, or changelog posts. If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set, it also creates or updates that verified admin account.

Local demo seed:

```powershell
npm.cmd run db:seed:demo
```

This sets `ENABLE_DEMO_SEED=true` and `NDL_SEED_RESET=true`, deletes existing database data, and recreates the clearly labeled `[DEMO]` local workflow dataset. Do not run this against production, and do not run it after creating local levels you want to keep. The old `NDL_SEED_DEMO` flag no longer enables demo data.

## First Production Admin

Run migrations first:

```powershell
npm.cmd run db:generate
npm.cmd run db:migrate:deploy
```

Production must use `npm.cmd run db:migrate:deploy`, not `prisma migrate dev`. Password reset requires the `PasswordResetToken` table, so run deploy migrations after shipping password reset changes and before relying on `/forgot-password`.

Then create or promote the first admin account by running the production-safe seed with admin env values:

```powershell
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_HANDLE="admin"
$env:ADMIN_NAME="NDL Admin"
$env:ADMIN_PASSWORD="replace-with-a-long-random-password"
npm.cmd run db:seed
Remove-Item Env:\ADMIN_EMAIL, Env:\ADMIN_HANDLE, Env:\ADMIN_NAME, Env:\ADMIN_PASSWORD
```

You can run `npm.cmd run admin:create` instead of `npm.cmd run db:seed` if you only want to create/update the admin and skip baseline rule seeding.

`db:seed` and `admin:create` are idempotent for the admin email. Re-running either updates the display name, player name, password, role, and verified state for that account. They refuse to reuse a player name owned by another email. The legacy `NDL_ADMIN_EMAIL`, `NDL_ADMIN_PLAYER_NAME`, `NDL_ADMIN_DISPLAY_NAME`, and `NDL_ADMIN_PASSWORD` variables are still accepted.

## Seeded Demo Accounts

These accounts exist only after `npm.cmd run db:seed:demo`.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@ndl.local` | `AdminPass123!` |
| Moderator | `mod@ndl.local` | `ModPass123!` |
| Player | `player@ndl.local` | `PlayerPass123!` |
| Player | `rival@ndl.local` | `PlayerPass123!` |

Demo data is intentionally marked with `[DEMO]`, demo-only account names, example.com links, and demo thumbnail assets. Production seeding does not create this data.

## Points Recalculation

NDL displays points from the current level rank/status at runtime, so stale stored values do not leak into public list pages. Because `Level.points` and accepted `Record.pointsAwarded` are also stored for consistency, run the recalculation script after deploying a scoring formula change or after importing/reranking production data:

```powershell
npm.cmd run points:recalculate
```

Run this against the target database with the same `DATABASE_URL` and production safety environment used for other one-off maintenance commands.

## Scripts

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run db:generate
npm.cmd run db:migrate
npm.cmd run db:migrate:deploy
npm.cmd run db:seed
npm.cmd run db:seed:demo
npm.cmd run db:up
npm.cmd run admin:create
npm.cmd run points:recalculate
```

## Core Workflows

- Guests can view the ranked list, level pages, rules, changelog, accepted records, player profiles, and player leaderboard.
- Players can register, verify email, log in, submit records, suggest levels, and view their private submission/suggestion statuses.
- Moderators can review pending or needs-changes record submissions and level suggestions, accept/approve, reject, request changes, and leave notes.
- Admins can manage levels/rankings/statuses, assign roles, publish rules, and publish changelog posts.
- Admins can convert approved level suggestions into pending, ranked, or legacy level entries.

## Privacy And Route Guard Verification

- Public record surfaces read from accepted `Record` rows or `Level.records`, not from pending/rejected `RecordSubmission` rows.
- Player-private submission history is rendered only behind `canSeeSubmission(...)`.
- Player-private level suggestions are visible only to the submitter and staff.
- `/submissions` requires a logged-in user and filters submissions by the current player.
- `/suggest-level` and `/level-suggestions` require verified logged-in users.
- `/moderation` calls `requireModerator()` server-side.
- `/admin`, `/admin/levels`, `/admin/users`, `/admin/rules`, and `/admin/changelog` call `requireAdmin()` server-side.
- `src/test/production-readiness.test.ts` statically checks these guardrails.

## SEO And Social Metadata

Global metadata is defined in `src/app/layout.tsx`.

- Title: `NDL - Nerfed Demonlist`
- Description: moderated Geometry Dash community leaderboard for approved nerfed demon completions
- OpenGraph/Twitter image placeholder: `public/og-image.svg`
- Favicon: `src/app/favicon.ico`

Before public launch, replace the placeholder OpenGraph image and favicon with final branded assets.

## Production Readiness Checklist

- Set production `DATABASE_URL`, `NODE_ENV=production`, `APP_URL`, `NEXT_PUBLIC_SITE_URL`, `SESSION_COOKIE_NAME`, and `SESSION_SECRET`.
- Set production SMTP variables so registration verification email can be sent.
- Run `npm.cmd run db:generate`, `npm.cmd run db:migrate:deploy`, and `npm.cmd run db:seed`.
- Run `npm.cmd run points:recalculate` after scoring formula changes or production data imports.
- Create the first admin through `npm.cmd run db:seed` with `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_HANDLE`, or run `npm.cmd run admin:create`.
- Confirm `ENABLE_DEMO_SEED` and `NDL_SEED_RESET` are unset or `false` in production.
- Confirm `UPLOAD_MODE=disabled` on Vercel production.
- Set `BLOB_READ_WRITE_TOKEN` if admins should upload thumbnails on production; otherwise use image URLs.
- Confirm no `[DEMO]` levels, demo users, example.com proof links, or demo changelog posts exist in production.
- Confirm `/admin` has no hidden demo warning before public launch.
- Replace `public/og-image.svg` and `src/app/favicon.ico` with final launch assets.
- Publish the real production rules document from `/admin/rules`.
- Add real levels only through `/admin/levels` or audited production data import.
- Review approved level suggestions before converting them into production levels.
- Verify `/moderation` is inaccessible to players/guests and `/admin/*` is inaccessible to non-admins.
- Verify pending, rejected, and needs-changes submissions are visible only to submitters and staff.
- Verify pending, rejected, and needs-changes level suggestions are visible only to submitters and staff.
- Run `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run lint`, and `npm.cmd run build`.

## Deployment Notes

Set `DATABASE_URL` to a production Postgres connection string and run Prisma migrations before starting the app. NDL stores proof links by default. Keep `UPLOAD_MODE=disabled` for serverless production hosting. Use Vercel Blob through `BLOB_READ_WRITE_TOKEN` for production admin thumbnail uploads. Full GitHub, Vercel, Neon, SMTP, and Namecheap notes are in [docs/deployment.md](docs/deployment.md).
