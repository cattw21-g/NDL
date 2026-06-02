# NDL Discord Bot

NDL supports Discord slash commands through Vercel-hosted HTTP Interactions. This is the recommended production mode because it does not need Railway, local hosting, or an always-running WebSocket/Gateway worker.

The Interactions Endpoint URL is:

```text
https://nerfeddemonlist.net/api/discord/interactions
```

The endpoint reads NDL data through the same public/staff-safe data paths as the JSON APIs. It must not scrape HTML pages and must not connect to a separate database outside the NDL app.

## Vercel HTTP Interactions Setup

1. Open the Discord Developer Portal and select the NDL application.
2. Go to **General Information** and copy the **Public Key** into Vercel as `DISCORD_PUBLIC_KEY`.
3. Copy the Application ID into Vercel as `DISCORD_APPLICATION_ID`.
4. Set the Interactions Endpoint URL to `https://nerfeddemonlist.net/api/discord/interactions`.
5. Add `NEXT_PUBLIC_SITE_URL=https://nerfeddemonlist.net` or `APP_URL=https://nerfeddemonlist.net`.
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

`DISCORD_GUILD_ID` is optional. Set it for fast test-guild registration; leave it blank for global production commands.

Run from the repo root:

```powershell
npm.cmd run discord:register
```

`DISCORD_BOT_TOKEN` is only needed for this command registration step. It is not required by the Vercel Interactions endpoint and must not be exposed to client code.

## Public Slash Commands

- `/top count` shows top ranked levels.
- `/level query` searches public levels.
- `/player handle` shows a public player summary.
- `/records handle` shows accepted public records.
- `/recent` shows recent accepted records.
- `/search query` groups public level and player results.
- `/rules` links to and summarizes the NDL rules.

Public commands only expose accepted/published public data. They must not display emails, password hashes, sessions, reset or verification tokens, private raw footage links, staff notes, admin notes, or environment secrets.

## Staff Slash Commands

- `/pending-records`
- `/pending-suggestions`
- `/submission id`
- `/suggestion id`
- `/audit query`
- `/stats`

Staff commands require `DISCORD_STAFF_ROLE_ID` and a guild interaction payload containing that role ID in `member.roles`. If the role is missing or role data is unavailable, NDL replies ephemerally:

```text
You do not have permission to use this command.
```

Staff responses are ephemeral by default. Use ephemeral replies for staff commands, and do not post proof links, raw footage links, moderator notes, queue details, or audit details in public Discord channels.

## HTTP Mode vs Gateway Mode

Vercel HTTP Interactions:

- Runs 24/7 for free on the existing Vercel deployment.
- Does not maintain online presence.
- Cannot listen to ordinary channel messages.
- Cannot run background jobs.
- Works well for slash commands that can answer quickly.

The existing `bot/` package remains as an optional legacy Gateway bot for future paid/long-running hosting. It is not required for production slash commands on Vercel.

## Protected Staff JSON API

NDL still exposes `/api/bot/staff/...` for future server-side bot clients. Those endpoints require:

```text
Authorization: Bearer <BOT_API_SECRET>
```

Keep `BOT_API_SECRET` only in Vercel/server environments and trusted bot hosts. Do not expose it in browsers or public Discord replies.
