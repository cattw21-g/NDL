import { EmbedBuilder } from "discord.js";

export const NDL_COLORS = {
  CYAN: 0x06b6d4,
  AMBER: 0xf59e0b,
  EMERALD: 0x10b981,
  PURPLE: 0xa855f7,
  ROSE: 0xf43f5e,
  SLATE: 0x334155,
  DARK_BG: 0x0f172a,
};

export function createWelcomeEmbed(siteUrl = "https://www.nerfeddemonlist.net"): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("✨ Welcome to the Nerfed Demonlist Community! ✨")
    .setDescription(
      `The definitive ranking and record tracking platform for **Nerfed Extreme Demons** in Geometry Dash.\n\n` +
        `Track leaderboards, verify demon completions, submit progress, and connect with other players pushing the limits of nerfed extremes!`,
    )
    .setColor(NDL_COLORS.CYAN)
    .addFields(
      {
        name: "🌐 Official Website",
        value: `[**nerfeddemonlist.net**](${siteUrl}) — Real-time demon placements, player rankings, point formulas, and video showcases.`,
        inline: false,
      },
      {
        name: "🧭 Server Navigation",
        value:
          `• <#${"rules"}> — List & community guidelines\n` +
          `• <#${"official-links"}> — Directory of verified NDL links\n` +
          `• <#${"how-to-submit"}> — Step-by-step submission guide\n` +
          `• <#${"general-chat"}> — Main community discussion\n` +
          `• <#${"demon-discussion"}> — Nerfed demon completions & runs\n` +
          `• <#${"bot-commands"}> — Slash commands (\`/top\`, \`/level\`, \`/player\`)`,
        inline: false,
      },
      {
        name: "📱 Creator & Socials",
        value: `Created by **@cattw_gd** • Check out the official TikTok at [tiktok.com/@cattw_gd](https://www.tiktok.com/@cattw_gd)`,
        inline: false,
      },
    )
    .setFooter({
      text: "Nerfed Demonlist • Official Community",
    })
    .setTimestamp();
}

export function createRulesEmbed(siteUrl = "https://www.nerfeddemonlist.net"): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("📜 Nerfed Demonlist — Community & Submission Rules")
    .setDescription(
      `To ensure fair competition, respectful discourse, and accurate leaderboard tracking, all members and players must abide by the following rules:`,
    )
    .setColor(NDL_COLORS.AMBER)
    .addFields(
      {
        name: "1️⃣ Respectful Community Conduct",
        value:
          "Treat all members, creators, and staff with respect. Harassment, hate speech, spamming, and toxic behavior are strictly prohibited.",
        inline: false,
      },
      {
        name: "2️⃣ Valid Record Proof Requirements",
        value:
          "All submissions must include clean video proof. Audible click sounds and audible in-game music/SFX are mandatory for top-tier completions. Cheat indicators and CPS counters are heavily recommended.",
        inline: false,
      },
      {
        name: "3️⃣ CBF (Click Between Frames) Policy",
        value:
          "CBF is **allowed** on Nerfed Demonlist, but you **must** indicate whether CBF was used during your run in the submission form.",
        inline: false,
      },
      {
        name: "4️⃣ Zero Tolerance for Cheating",
        value:
          "Using noclip, speedhacks, hitboxes, macros, physics mods, botting, or cut footage results in an immediate ban from the list and community.",
        inline: false,
      },
      {
        name: "5️⃣ Raw Footage & Verification",
        value:
          "Staff may request uncut raw footage with desktop recording for top placements. Keep raw recordings safe until your submission is approved.",
        inline: false,
      },
      {
        name: "📖 Complete Rulebook",
        value: `Read the full, official guidelines at [nerfeddemonlist.net/rules](${siteUrl}/rules).`,
        inline: false,
      },
    )
    .setFooter({
      text: "Nerfed Demonlist • Fair Play & Guidelines",
    })
    .setTimestamp();
}

export function createOfficialLinksEmbed(siteUrl = "https://www.nerfeddemonlist.net"): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("🔗 Nerfed Demonlist — Official Links & Directory")
    .setDescription("Bookmark all the official links for the Nerfed Demonlist project:")
    .setColor(NDL_COLORS.EMERALD)
    .addFields(
      {
        name: "🌐 Main Website",
        value: `[https://www.nerfeddemonlist.net](${siteUrl})`,
        inline: true,
      },
      {
        name: "🏆 Ranked Demons List",
        value: `[Demons Leaderboard](${siteUrl}/)`,
        inline: true,
      },
      {
        name: "👑 Top Players",
        value: `[Player Standings](${siteUrl}/players)`,
        inline: true,
      },
      {
        name: "📥 Submit a Record",
        value: `[Submit Run Proof](${siteUrl}/submit)`,
        inline: true,
      },
      {
        name: "💡 Suggest a Level",
        value: `[Level Suggestions](${siteUrl}/suggest-level)`,
        inline: true,
      },
      {
        name: "⏳ Upcoming Demons",
        value: `[Upcoming Hub](${siteUrl}/upcoming)`,
        inline: true,
      },
      {
        name: "📱 TikTok Channel",
        value: `[@cattw_gd on TikTok](https://www.tiktok.com/@cattw_gd)`,
        inline: true,
      },
      {
        name: "📰 Changelog & News",
        value: `[List Changelog](${siteUrl}/changelog)`,
        inline: true,
      },
    )
    .setFooter({
      text: "Nerfed Demonlist Directory",
    });
}

export function createHowToSubmitEmbed(siteUrl = "https://www.nerfeddemonlist.net"): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("📥 How to Submit Runs to Nerfed Demonlist")
    .setDescription(
      "Submitting your completions and progress to the list is fast and automatic through our website!",
    )
    .setColor(NDL_COLORS.PURPLE)
    .addFields(
      {
        name: "Step 1: Beat or Progress on a Ranked Level",
        value:
          "Check the [Ranked Demons List](https://www.nerfeddemonlist.net/) to verify the level and required percentage.",
        inline: false,
      },
      {
        name: "Step 2: Ensure Proof Guidelines Are Met",
        value:
          "• Clear video with gameplay and endscreen\n• Audible clicks/taps & game audio\n• State FPS and CBF usage in submission form",
        inline: false,
      },
      {
        name: "Step 3: Submit via Website",
        value: `Go to [**nerfeddemonlist.net/submit**](${siteUrl}/submit) while logged in, pick the level, and paste your video link.`,
        inline: false,
      },
      {
        name: "Step 4: Real-Time Status Tracking",
        value:
          "When you submit, your level card on the website will show a glowing **`⏳ PENDING`** badge until moderators review and verify your run!",
        inline: false,
      },
    )
    .setFooter({
      text: "NDL Submission System",
    });
}
