# NDL Discord Bot

NDL supports Discord slash commands through Vercel-hosted HTTP Interactions. This is the recommended production mode because it does not need Railway, local hosting, or an always-running WebSocket/Gateway worker.

The production Interactions Endpoint URL is:

```text
https://www.nerfeddemonlist.net/api/discord/interactions
```

Use the `www` URL in the Discord Developer Portal to avoid redirect-related endpoint verification failures. The endpoint reads NDL data through the same public/staff-safe data paths as the JSON APIs. It must not scrape HTML pages and must not connect to a separate database outside the NDL app.

## Vercel HTTP Interactions Setup

1. Open the Discord Developer Portal and select the NDL application.
2. Go to **General Information** and copy the **Public Key** into Vercel as `DISCORD_PUBLIC_KEY`.
3. Copy the Application ID into Vercel as `DISCORD_APPLICATION_ID`.
4. Set the Interactions Endpoint URL to `https://www.nerfeddemonlist.net/api/discord/interactions`.
5. Add `NEXT_PUBLIC_SITE_URL=https://www.nerfeddemonlist.net` or `APP_URL=https://www.nerfeddemonlist.net`.
6. Optionally set `DISCORD_STAFF_ROLE_ID` to the Discord role allowed to use staff commands.
7. Redeploy Vercel after changing env vars.

Discord validates the endpoint by sending a signed PING interaction. The NDL route verifies `X-Signature-Ed25519` and `X-Signature-Timestamp`, then returns PONG.

## Command Registration

Slash commands are registered with Discord's REST API. This is a one-off maintenance step, not a 24/7 process.

Required local or one-off env vars:

```text
DISCORD_BOT_TOKEN=""
DISCORD_APPLICATION_ID=""
DISCORD_GUILD_ID=""
```

`DISCORD_GUILD_ID` is optional. Set it for fast test-guild registration; leave it blank for global production commands. Global commands may take time to propagate.

Run from the repo root:

```powershell
npm.cmd run discord:register
```

`DISCORD_BOT_TOKEN` is only needed for this command registration step. It is not required by the Vercel Interactions endpoint and must not be exposed to client code.

## Public Slash Commands

- `/top count status` shows top public levels. `status` can be `ranked`, `legacy`, or `all-public`.
- `/level query` searches public levels and shows rank/status, points, metadata, record count, showcase link, and NDL link.
- `/player handle` shows total points, accepted record count, hardest ranked record, top records, and NDL player link.
- `/records handle limit` shows accepted public records for a player.
- `/recent count` shows recent accepted public records.
- `/search query` groups public level and player results.
- `/rules` links to NDL rules and shows a short rules summary.
- `/level-records level limit` shows accepted records for a public level.
- `/leaderboard count` shows top players by total points.
- `/about` explains NDL, lists public bot commands, and includes the non-affiliation note.
- `/status` shows safe public API/bot status, ranked level count, recent accepted record count, and Vercel HTTP mode.

Level and player fields support autocomplete where Discord provides autocomplete interactions. Autocomplete uses public search data only and never requires a staff token.

Public commands only expose accepted/published public data. They must not display emails, password hashes, sessions, reset or verification tokens, private raw footage links, staff notes, admin notes, API secrets, `DATABASE_URL`, SMTP secrets, or environment values.

## Staff Slash Commands

- `/pending-records limit`
- `/pending-suggestions limit`
- `/submission id`
- `/suggestion id`
- `/audit query`
- `/stats`

Staff commands require `DISCORD_STAFF_ROLE_ID` and a guild interaction payload containing that role ID in `member.roles`. If the role is missing or role data is unavailable, NDL replies ephemerally:

```text
You do not have permission to use this command.
```

Staff responses are ephemeral by default, and staff-only data should use ephemeral replies. They should stay concise and link staff back to `/moderation` or `/admin/audit` rather than dumping private proof links, raw footage links, moderator notes, queue details, or audit details into a public channel.

`/stats` includes pending records, pending suggestions, ranked levels, legacy levels, users, and accepted records in the last 7 days.

## Troubleshooting

- The Interactions Endpoint URL should be `https://www.nerfeddemonlist.net/api/discord/interactions`.
- `DISCORD_PUBLIC_KEY` must match the same Discord application that owns the registered slash commands.
- Vercel must be redeployed after changing Discord env vars.
- Slash commands require `npm.cmd run discord:register` after command definition changes.
- Remember that global commands may take time to propagate.
- Use `DISCORD_GUILD_ID` for fast test-guild registration; omit it for global production registration.
- `DISCORD_BOT_TOKEN` is not used by the Vercel endpoint. It is only for the one-off registration script.

## HTTP Mode vs Gateway Mode

Vercel HTTP Interactions:

- Runs 24/7 for free on the existing Vercel deployment.
- Does not maintain online presence.
- Cannot listen to ordinary channel messages.
- Cannot run scheduled background jobs.
- Works well for slash commands that can answer quickly.

The existing `bot/` package remains as an optional legacy Gateway bot for future paid/long-running hosting. It is not required for production slash commands on Vercel.

## Protected Staff JSON API

NDL still exposes `/api/bot/staff/...` for future server-side bot clients. Those endpoints require:

```text
Authorization: Bearer <BOT_API_SECRET>
```

Keep `BOT_API_SECRET` only in Vercel/server environments and trusted bot hosts. Do not expose it in browsers or public Discord replies.
