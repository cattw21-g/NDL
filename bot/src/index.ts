import {
  ActivityType,
  Client,
  Events,
  GatewayIntentBits,
  Interaction,
} from "discord.js";

import { loadBotConfig } from "./config.js";
import { createNdlApiClient } from "./ndl-api.js";
import { commands } from "./commands/index.js";

const config = loadBotConfig();
const api = createNdlApiClient(config);
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});
const commandByName = new Map(
  commands.map((command) => [command.data.name, command]),
);

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ NDL Discord bot logged in as ${readyClient.user.tag}.`);
  readyClient.user.setPresence({
    activities: [
      {
        name: "nerfeddemonlist.net | /top",
        type: ActivityType.Watching,
      },
    ],
    status: "online",
  });
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (interaction.isButton()) {
    const customId = interaction.customId;
    if (!interaction.guild) {
      await interaction.reply({ content: "This button can only be used in the NDL server.", ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true }).catch(() => {});

    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (!member) {
      await interaction.editReply({ content: "Could not fetch your server member data." });
      return;
    }

    if (customId === "link_ndl_account") {
      const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
      const code = `NDL-${randomDigits}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      try {
        const { prisma } = await import("../../src/lib/db.js");
        await prisma.discordLinkToken.deleteMany({
          where: { discordUserId: interaction.user.id },
        }).catch(() => {});

        await prisma.discordLinkToken.create({
          data: {
            code,
            discordUserId: interaction.user.id,
            discordUsername: interaction.user.username,
            expiresAt,
          },
        });
      } catch (err) {
        console.error("Link token creation error:", err);
      }

      await interaction.editReply({
        content: `🔐 **Link Your Nerfed Demonlist Profile**\n\n1. Open your profile on the website: **https://www.nerfeddemonlist.net/players**\n2. In the **Discord Integration** box, enter your 1-time verification code: **\`${code}\`**\n3. Click **"Verify & Link"**!\n\n*(This code expires in 15 minutes. Once linked, your Top 10/50/100, Victor, and Player roles will update automatically!)*`,
      });
      return;
    }

    if (customId === "sync_ndl_roles") {
      try {
        const { prisma } = await import("../../src/lib/db.js");
        const { syncDiscordRolesForUser } = await import("../../src/lib/discord-role-sync.js");

        const user = await prisma.user.findUnique({
          where: { discordUserId: interaction.user.id },
        });

        if (!user) {
          await interaction.editReply({
            content: "❌ Your Discord account is not linked to an NDL profile yet!\nClick **`🔗 Link NDL Account`** above to connect your account.",
          });
          return;
        }

        const res = await syncDiscordRolesForUser(user.id);
        const added = res.addedRoles.length > 0 ? `\n✅ **Roles Added:** ${res.addedRoles.join(", ")}` : "";
        const removed = res.removedRoles.length > 0 ? `\n❌ **Roles Removed:** ${res.removedRoles.join(", ")}` : "";

        if (res.addedRoles.length === 0 && res.removedRoles.length === 0) {
          await interaction.editReply({
            content: `✨ Your Discord roles for **${user.playerName}** are already up to date!`,
          });
        } else {
          await interaction.editReply({
            content: `🎉 **Roles Synchronized for ${user.playerName}:**${added}${removed}`,
          });
        }
      } catch (err) {
        await interaction.editReply({
          content: `Failed to sync roles: ${String(err)}`,
        });
      }
      return;
    }

    let targetRoleName = "";
    let roleLabel = "";
    if (customId === "toggle_role_announcements") {
      targetRoleName = "Announcements Ping";
      roleLabel = "🔔 Announcements Ping";
    } else if (customId === "toggle_role_updates") {
      targetRoleName = "List Updates Ping";
      roleLabel = "📰 List Updates Ping";
    } else {
      return;
    }

    const role = interaction.guild.roles.cache.find((r) => r.name.includes(targetRoleName));
    if (!role) {
      await interaction.editReply({ content: `The role "${roleLabel}" could not be found. Please contact staff.` });
      return;
    }

    const hasRole = member.roles.cache.has(role.id);
    if (hasRole) {
      await member.roles.remove(role.id).catch(() => {});
      await interaction.editReply({ content: `❌ Removed **${roleLabel}** role. You will no longer receive these pings.` });
    } else {
      await member.roles.add(role.id).catch(() => {});
      await interaction.editReply({ content: `✅ Added **${roleLabel}** role! You will now receive these notifications.` });
    }
    return;
  }

  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commandByName.get(interaction.commandName);

  if (!command) {
    await interaction.reply({
      content: "Unknown NDL bot command.",
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction, { api, config });
  } catch (error) {
    console.error("NDL bot command failed", {
      command: interaction.commandName,
      error,
    });

    const content = "NDL bot hit an unexpected error. Try again later.";

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content, embeds: [] });
      return;
    }

    await interaction.reply({ content, ephemeral: true });
  }
});

// Global error handlers to ensure 24/7 continuous uptime
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

// Lightweight HTTP keep-alive server for 24/7 cloud hosting (Render / Railway / Koyeb / Fly.io)
import http from "node:http";

const port = process.env.PORT || process.env.BOT_PORT || 8080;
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      status: "online",
      bot: client.user?.tag || "initializing",
      ping: `${client.ws.ping}ms`,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }),
  );
});

server.listen(port, () => {
  console.log(`📡 Bot 24/7 health check server listening on port ${port}`);
});

await client.login(config.discordToken);
