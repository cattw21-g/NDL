# NDL Discord Bot

The NDL Discord bot is a separate TypeScript package in `bot/`. It reads NDL through JSON APIs only:

- Public commands call `/api/public/...`.
- Staff commands call `/api/bot/staff/...` with `Authorization: Bearer <BOT_API_SECRET>`.
- The bot must not scrape HTML pages or connect directly to Neon/Postgres.

## Discord Application Setup

1. Open the Discord Developer Portal and create an application.
2. Add a bot user and copy the bot token into `DISCORD_BOT_TOKEN`.
3. Copy the application ID into `DISCORD_CLIENT_ID`.
4. Under Bot settings, keep the default `Guilds` intent. NDL does not need privileged message-content intents.
5. Invite the bot with the `bot` and `applications.commands` scopes. Grant only the channel permissions it needs to send slash-command replies.

For local development, set `DISCORD_GUILD_ID` to a test server ID so slash commands register instantly for that guild. Leave it blank for global production command registration.

## Environment Variables

Copy `bot/.env.example` to `bot/.env` for local development:

```text
DISCORD_BOT_TOKEN=""
DISCORD_CLIENT_ID=""
DISCORD_GUILD_ID=""
NDL_PUBLIC_API_BASE="https://nerfeddemonlist.net"
NDL_BOT_API_SECRET=""
DISCORD_STAFF_ROLE_ID=""
```

`NDL_BOT_API_SECRET` is the bot-side copy of the website `BOT_API_SECRET`. Store it only in the bot host secret manager. Do not put it in client code, browser-visible variables, screenshots, or Discord replies.

## Local Commands

From the repo root:

```powershell
npm.cmd run bot:register
npm.cmd run bot:dev
npm.cmd run bot:build
```

From the `bot/` folder:

```powershell
npm.cmd run register-commands
npm.cmd run dev
npm.cmd run build
npm.cmd run start
```

Run `register-commands` after changing slash command names, options, or descriptions.

## Public Slash Commands

- `/top count` shows top ranked levels from `/api/public/levels`.
- `/level query` searches public levels from `/api/public/search`.
- `/player handle` shows a public player summary from `/api/public/players/[handle]`.
- `/records handle` shows accepted public records from `/api/public/players/[handle]/records`.
- `/recent` shows recent accepted public records from `/api/public/recent-records`.
- `/search query` groups public level and player results from `/api/public/search`.
- `/rules` links to the rules page and summarizes `/api/public/rules`.

Public commands are safe for public Discord channels because the API omits pending submissions, rejected submissions, staff notes, private raw footage links, emails, tokens, password hashes, sessions, and environment values.

## Staff Slash Commands

- `/pending-records`
- `/pending-suggestions`
- `/submission id`
- `/suggestion id`
- `/audit query`
- `/stats`

Staff commands require both:

1. `DISCORD_STAFF_ROLE_ID` matching one of the caller's Discord roles.
2. `NDL_BOT_API_SECRET` configured on the bot host.

If a user lacks the staff role, the bot replies ephemerally:

```text
You do not have permission to use this command.
```

Staff replies are ephemeral by default. Do not post proof links, raw footage links, moderator notes, queue details, audit entries, or other private moderation context in public channels.

## Deployment Options

The bot can run anywhere that supports a long-running Node 20 process, such as a VPS, Railway, Fly.io, Render background worker, or another Discord-bot-friendly host. Vercel serverless functions are not a good fit for the bot process because Discord gateway clients need a persistent connection.

Deployment checklist:

- Build with `npm.cmd --prefix bot run build`.
- Start with `npm.cmd --prefix bot run start`.
- Store bot env vars in the bot host secret manager.
- Register commands after deployment or from a trusted local machine.
- Keep `NDL_PUBLIC_API_BASE=https://nerfeddemonlist.net` for production.
- Keep `NDL_BOT_API_SECRET` synchronized with the website `BOT_API_SECRET`.

## Safety Rules

- Never expose `BOT_API_SECRET` or `NDL_BOT_API_SECRET` in Discord.
- Never connect the bot directly to Neon/Postgres.
- Never scrape NDL HTML pages.
- Use public endpoints for public commands and staff endpoints only after Discord role checks.
- Use ephemeral replies for all staff command output.
- Avoid displaying user emails, password hashes, session data, verification tokens, reset tokens, SMTP secrets, `DATABASE_URL`, or raw environment variables.
- Treat raw footage and proof image links as staff-only moderation data.
- Respect API rate-limit errors and back off before retrying.
