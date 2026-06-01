# NDL Production Deployment

This guide covers a first production deployment on GitHub, Vercel, and Neon Postgres. Keep local development on Docker Postgres if you prefer; production should use a managed Postgres database and real SMTP.

## 1. GitHub Setup

1. Create a private or public GitHub repository for NDL.
2. Commit the app source, migrations, `README.md`, and this `docs/` folder.
3. Do not commit `.env`, local uploads under `public/uploads/`, `.vercel/`, `.next/`, or generated Prisma client files.
4. Push the branch Vercel should deploy from, usually `main`.

## 2. Neon Postgres

1. Create a Neon project and database for NDL.
2. Copy the production Postgres connection string and include `sslmode=require` when Neon provides that option.
3. Set Vercel `DATABASE_URL` to the Neon runtime connection string.
4. Run production migrations from a trusted machine or CI job:

```powershell
$env:DATABASE_URL="postgresql://..."
npm.cmd run db:generate
npm.cmd run db:migrate:deploy
```

If Neon recommends different direct and pooled URLs, use the direct URL for one-off migration commands and the pooled/runtime URL for Vercel.

Production must use `npm.cmd run db:migrate:deploy`, not `prisma migrate dev`. After deploying the password reset release, run `npm.cmd run db:migrate:deploy` once so Neon creates the `PasswordResetToken` table before users request reset emails. If this migration is skipped, password reset requests will fail at runtime because the table does not exist.

## 3. Vercel Deployment

1. Import the GitHub repo in Vercel.
2. Framework preset: Next.js.
3. Install command: `npm install`.
4. Build command: `npm run build`.
5. Output directory: leave as Vercel default.
6. Add the production environment variables below before the first deploy.

Required production variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string. |
| `APP_URL` | Canonical app URL used in email verification links, such as `https://ndl.example.com`. |
| `NEXT_PUBLIC_SITE_URL` | Canonical public URL for metadata and social previews. Usually the same as `APP_URL`. |
| `SESSION_SECRET` | Strong random secret, at least 32 characters. |
| `UPLOAD_MODE` | Use `disabled` for Vercel production. |
| `BLOB_READ_WRITE_TOKEN` | Optional Vercel Blob token for production admin thumbnail uploads. |
| `MAX_IMAGE_UPLOAD_MB` | Optional thumbnail image upload limit, default `5`. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` | Required for production email verification. |
| `SMTP_USER`, `SMTP_PASSWORD` | Required if your SMTP provider uses auth. |
| `SMTP_REPLY_TO` | Optional reply address for verification email. |
| `SMTP_SECURE` | `true` for implicit TLS, usually port 465; otherwise `false`. |
| `SMTP_DISABLE_TRACKING_HINT` | Optional best-effort no-tracking header; provider settings still control tracking. |

Generate a `SESSION_SECRET` locally with PowerShell:

```powershell
$bytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Do not set `ENABLE_DEMO_SEED=true` in production.

## 4. First Admin

Production seed does not create demo accounts. To create the first verified admin, set these variables temporarily in the environment where you run the seed/admin command:

```powershell
$env:DATABASE_URL="postgresql://..."
$env:SESSION_SECRET="paste-the-production-session-secret"
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_HANDLE="admin"
$env:ADMIN_NAME="NDL Admin"
$env:ADMIN_PASSWORD="replace-with-a-long-random-password"
npm.cmd run db:seed
```

You can also run:

```powershell
npm.cmd run admin:create
```

Both commands create or update the verified admin account for `ADMIN_EMAIL`. After the account works, remove `ADMIN_PASSWORD` from temporary shells and avoid keeping it in Vercel unless you intentionally want future seed runs to rotate that admin password.

## 4.1 Seed Modes

Use production-safe seed for production, staging, and any local database that contains custom work:

```powershell
npm.cmd run db:seed
```

This updates the baseline rules document and optional environment admin only. It does not create demo levels, delete users, replace uploads, or overwrite custom levels.

Use demo seed only for disposable local demo databases:

```powershell
npm.cmd run db:seed:demo
```

This sets `ENABLE_DEMO_SEED=true` and `NDL_SEED_RESET=true`, clears the demo workflow tables, and creates visibly labeled demo users, levels, records, thumbnails, rules, and changelog content. Do not run it on production or on a local database containing levels/uploads you want to keep.

## 5. SMTP Email Verification

Production registration requires SMTP. Without SMTP, development logs verification links and codes to the terminal, but production redirects users back to the verification page with a clear email-configuration error instead of crashing.

Typical SMTP variables:

```powershell
$env:APP_URL="https://ndl.example.com"
$env:SMTP_HOST="smtp.example.com"
$env:SMTP_PORT="587"
$env:SMTP_USER="smtp-user"
$env:SMTP_PASSWORD="smtp-password"
$env:SMTP_FROM="Nerfed Demonlist <noreply@nerfeddemonlist.net>"
$env:SMTP_REPLY_TO="staff@nerfeddemonlist.net"
$env:SMTP_SECURE="false"
$env:SMTP_DISABLE_TRACKING_HINT="true"
```

Use a verified sender address with your SMTP provider.

Two low-cost setup paths:

- Brevo free SMTP: create a Brevo account, verify a sender/domain, copy the SMTP login/key, use `smtp-relay.brevo.com`, port `587`, and `SMTP_SECURE=false`.
- Gmail app-password SMTP: enable 2-Step Verification, create an app password, use `smtp.gmail.com`, port `587`, and `SMTP_SECURE=false`. For port `465`, set `SMTP_SECURE=true`.

Inbox placement and delivery speed are not fully controlled by NDL. They depend on sender/domain verification, SPF, DKIM, DMARC, domain reputation, recipient spam filters, and Brevo account reputation. The app sends a simple transactional email with one verification link, a six-digit fallback code, text and HTML bodies, and a small body logo loaded from `APP_URL/email-logo.png` when `APP_URL` is configured. This body logo does not control the Outlook/Gmail sender avatar. If email still lands in junk or takes around a minute, check provider reputation/settings and DNS authentication first.

Production Brevo checklist:

1. Brevo sender or domain is verified.
2. SPF, DKIM, and DMARC records are present and passing.
3. SMTP IP restriction is disabled for Vercel unless you have stable outbound IPs.
4. `SMTP_FROM` is `Nerfed Demonlist <noreply@nerfeddemonlist.net>`.
5. `APP_URL` is `https://nerfeddemonlist.net`.
6. Vercel is redeployed after every environment variable change.
7. Registration and resend verification are tested after deployment.
8. Click/open tracking is disabled in Brevo settings if desired; `SMTP_DISABLE_TRACKING_HINT=true` is only a best-effort email header.

## 6. Uploads

For Vercel production, set:

```text
UPLOAD_MODE=disabled
```

NDL will continue to support proof links. Local filesystem uploads are for local development or self-hosted persistent servers only. Vercel/serverless filesystems are not reliable storage for uploaded thumbnails, proof images, or videos.

For production admin thumbnail uploads on Vercel:

1. In Vercel, open Storage and create or connect a Blob store.
2. Copy the generated `BLOB_READ_WRITE_TOKEN` into the project Environment Variables.
3. Keep `UPLOAD_MODE=disabled`.
4. Redeploy. `/admin/levels` will allow admins to upload PNG/JPG/WebP thumbnails from their PC, save the returned public Blob URL on the level, and keep manual Thumbnail URL entry available.

If `BLOB_READ_WRITE_TOKEN` is missing, production upload controls stay disabled and admins must use a direct image URL.

If you self-host and intentionally want local image uploads in production, set both:

```text
UPLOAD_MODE=local
ALLOW_LOCAL_UPLOADS_IN_PRODUCTION=true
```

MP4 uploads remain disabled in production. Record completion videos and raw footage should be submitted as YouTube/Drive-style links.

## 7. Namecheap Domain Notes

1. Add the domain in Vercel Project Settings > Domains.
2. In Namecheap Advanced DNS, copy the exact DNS records Vercel shows for your domain.
3. For `www`, Vercel commonly asks for a CNAME record.
4. For the apex/root domain, Vercel may ask for A records or for you to use Vercel nameservers.
5. Treat the Vercel dashboard as the source of truth, then wait for DNS propagation and HTTPS issuance.

Set `APP_URL` and `NEXT_PUBLIC_SITE_URL` to the final HTTPS domain after the domain is connected.

## 8. Launch Checklist

1. `DATABASE_URL` points at Neon production.
2. `SESSION_SECRET` is strong and not a placeholder.
3. `UPLOAD_MODE=disabled` on Vercel.
4. `BLOB_READ_WRITE_TOKEN` is set if admins should upload thumbnails; otherwise Thumbnail URL is the production path.
5. SMTP variables send real verification email.
6. `APP_URL` and `NEXT_PUBLIC_SITE_URL` are `https://nerfeddemonlist.net`.
7. `ENABLE_DEMO_SEED` is unset or `false`.
8. Migrations have been run with `npm.cmd run db:migrate:deploy`.
9. Baseline seed has been run with `npm.cmd run db:seed`.
10. First admin can log in.
11. `public/og-image.svg` and `src/app/favicon.ico` have been replaced with final launch assets if desired.
12. `/admin` shows no hidden demo warning, or any hidden demo rows have been intentionally removed before public launch.

## 9. Pre-Launch QA

Run the local verification sequence before tagging a launch candidate:

```powershell
npm.cmd run db:generate
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run typecheck
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Manual QA checklist:

1. Register a new user and verify email through SMTP or the local dev console fallback.
2. Confirm unverified users cannot submit records or level suggestions.
3. Submit a record with links only; confirm it appears in `/submissions` and `/moderation`.
4. Accept the record; confirm the level page and player leaderboard update.
5. Submit a level suggestion; confirm it appears in `/level-suggestions` and `/moderation`.
6. Approve the level suggestion as staff, confirm `/moderation` shows the admin-only conversion button, and convert it as admin from the prefilled `/admin/levels` form.
7. Confirm `/admin` and `/moderation` reject normal player accounts.
8. Confirm rejected and needs-changes records/suggestions are visible only to submitter and staff.
9. Toggle light, dark, and system theme across public, auth, submit, moderation, and admin routes.
10. Confirm production has no visible demo levels, demo users, demo records, or demo thumbnails unless `ENABLE_DEMO_SEED=true`.
