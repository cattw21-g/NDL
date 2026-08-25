import "dotenv/config";
import { prisma } from "../src/lib/db.js";
import { createRulesEmbed } from "../bot/src/embed-templates.js";

const updatedRulesContent = `## General policy
- NDL ranks approved nerfed Geometry Dash demon versions and accepted records on those versions.
- Every record and level suggestion is reviewed by staff before it affects public rankings or points.
- High-ranked means main-list rank #1-#50 unless staff states otherwise.
- Staff may request extra proof when a run, level version, link, or technical detail is unclear.

## Record requirements
- Records must be completed on the accepted NDL level version and show a full completion, endscreen, FPS, and enough context for moderators to identify the run.
- The submitted completion video must be watchable by staff and must match the player, level, and version being claimed.
- Players must report FPS, CBF usage, input method, click/audio proof, and any relevant recording notes.
- A record is not public and does not award points until staff accepts it.

## Video and raw footage
- Completion video links are the primary proof method and should use stable public or reviewer-accessible URLs.
- Raw footage is required for high-ranked records and may be requested for any suspicious, borderline, or technically unusual run.
- Raw footage links are visible only to staff unless the submitter chooses to make them public.
- Do not cut away from the run before the completion and endscreen are clear enough to review.

## Click audio and microphone proof
- Click audio is required for serious records. Fake, added, replaced, or edited click sounds are banned.
- Separate microphone or click tracks are required for high-ranked records and strongly recommended for all records.
- Game audio should be present unless a moderator explicitly accepts a documented reason.
- Audio should line up with visible inputs and gameplay timing.

## Overlays and visibility
- FPS, CPS, cheat indicators, and other proof overlays should remain visible when they are relevant to the run.
- Overlay-only tools may be used for display and proof, but they must not alter gameplay, inputs, hitboxes, physics, or level data.
- Staff may reject proof that hides important UI, crops essential context, or makes the run difficult to verify.

## Allowed tools and settings
- CBF is allowed for records unless a future rules update changes this policy.
- Standard recording, streaming, input display, FPS display, and non-gameplay overlay tools are allowed.
- Practice, start position, or macro tools may be used for routing and verification work outside submitted record attempts.

## Banned tools and methods
- Physics bypass is not allowed unless NDL publishes a specific exception for a level or category.
- Speedhack, noclip, macros, replay bots, auto-clickers, hitbox-changing tools, input correction, and level-modifying hacks are banned for records.
- Original replay or macro compatibility is only a structural level-eligibility check. It is never an allowed record method.
- Submitted records must be human completions, not replayed or automated completions.

## Level eligibility
- Eligible nerfs need a real Geometry Dash level ID, clear publisher or host credit, original level credit, nerf creator credit, verifier credit, and a stable showcase.
- **Nerfed versions of unverified levels ARE allowed**: You are explicitly permitted to create and suggest nerfed versions of unverified levels (such as unverified upcoming top demons, impossible levels, or work-in-progress projects), as long as the nerfed version has been legitimately verified and uploaded to Geometry Dash servers.
- A nerfed level should preserve the original route, click timing, speed, portals, gamemode order, and progression closely enough that original replay or macro compatibility is plausible under matching conditions.
- Matching conditions include game version, physics expectations, FPS/CBF assumptions, intended route, and documented exceptions for bugfixes, impossible original transitions, or necessary compatibility changes.
- Staff may reject a suggestion if the level is not identifiable, is too far from the original, or cannot be reviewed safely.

## Submissions and review
- Submitters should provide working links, accurate credits, and enough detail for staff to reproduce the review decision.
- Staff may accept, reject, or mark a record or suggestion as needs changes.
- Broken links, missing proof, unclear versions, bad audio, suspicious footage, or rule violations can delay or prevent acceptance.
- Private submission details, staff notes, and private proof links stay off public pages.

## Ranking and points
- Ranked levels award computed points based on their current main-list rank. Rank #1 awards 320 points and lower ranks decrease from the same formula.
- Legacy levels award a fixed 25 points in the current implementation.
- Pending, rejected, and removed levels do not award points.
- A player's leaderboard score counts their best accepted record per ranked or legacy level.

## Moderation discretion
- Rules cannot cover every edge case. NDL staff may use judgment when evidence, level structure, or technical setup creates uncertainty.
- Staff decisions should leave clear notes so submitters understand what changed or what proof is missing.
- Rankings, records, and points may change after review if new information becomes available.`;

async function main() {
  console.log("Updating active RulesDocument in database...");

  const existingRules = await prisma.rulesDocument.findFirst({
    where: { isActive: true },
    orderBy: { publishedAt: "desc" },
  });

  if (existingRules) {
    await prisma.rulesDocument.update({
      where: { id: existingRules.id },
      data: {
        content: updatedRulesContent,
        updatedAt: new Date(),
      },
    });
    console.log("✅ Updated existing active RulesDocument:", existingRules.id);
  } else {
    const newDoc = await prisma.rulesDocument.create({
      data: {
        version: "production-v1",
        content: updatedRulesContent,
        isActive: true,
        publishedAt: new Date(),
      },
    });
    console.log("✅ Created new active RulesDocument:", newDoc.id);
  }

  // Update Discord #📜・rules channel embed
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim() || "1541532007304003595";

  if (!token) throw new Error("Missing bot token");

  const chanRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
    headers: { Authorization: `Bot ${token}` },
  });
  const channels: Array<{ id: string; name: string }> = await chanRes.json();
  const rulesChan = channels.find((c) => c.name.includes("rules"));

  if (rulesChan) {
    console.log(`Posting updated rules embed to #${rulesChan.name}...`);
    const embed = createRulesEmbed("https://www.nerfeddemonlist.net");

    // Clear old messages in #rules
    const oldMsgsRes = await fetch(`https://discord.com/api/v10/channels/${rulesChan.id}/messages?limit=10`, {
      headers: { Authorization: `Bot ${token}` },
    });
    const oldMsgs: Array<{ id: string }> = await oldMsgsRes.json();
    for (const m of oldMsgs) {
      await fetch(`https://discord.com/api/v10/channels/${rulesChan.id}/messages/${m.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bot ${token}` },
      }).catch(() => {});
    }

    const postRes = await fetch(`https://discord.com/api/v10/channels/${rulesChan.id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ embeds: [embed.toJSON()] }),
    });

    if (postRes.ok) {
      console.log("✅ Posted updated rules embed to Discord #📜・rules!");
    } else {
      console.error("Failed to post embed:", await postRes.text());
    }
  }

  console.log("🎉 All rules updated successfully across website and Discord!");
}

main().catch(console.error);
