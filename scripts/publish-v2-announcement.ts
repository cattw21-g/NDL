import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { requireDatabaseUrl } from '../src/lib/production-env';

const connectionString = requireDatabaseUrl(process.env, 'publish v2 announcement');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, displayName: true }
  });

  await prisma.changelogPost.updateMany({
    where: { isPinned: true },
    data: { isPinned: false },
  });

  const slug = 'nerfed-demonlist-v2-0-0-official-roadmap';
  const title = 'Nerfed Demonlist v2.0.0: The Future of NDL (Official Roadmap & Feature Release)';
  const summary = 'Announcing Nerfed Demonlist v2.0.0! A monumental milestone featuring 19 generational upgrades: Official Public API, Interactive World Map, Subdivisions, Player Geolocation, Advanced Stats Viewer, Completion Sorting, Player Claiming, Submission Locking, Under Consideration status, and more.';

  const content = `Hey everyone!

Following the successful rollout of **Nerfed Demonlist v1.0.0 Stable**, the NDL team is proud to officially announce our biggest milestone yet: **Nerfed Demonlist v2.0.0**!

This update brings full competitive feature parity with the wider Geometry Dash demonlist ecosystem while introducing custom features engineered specifically for nerfed demons.

---

### The 19 Official Features of Nerfed Demonlist v2.0.0

#### 1. Public API
Gives developers an official way to retrieve demons, players, records, rankings, etc. A Discord bot or another website can now automatically pull current NDL data instead of scraping webpages.
*Explore the documentation at [/api-docs](/api-docs).*

#### 2. Interactive World Map
Displays leaderboard activity geographically. Areas are shaded based on player points, and users can click locations to explore players from that area. Pointercrate has a point-distribution heat map.
*View the live map at [/map](/map).*

#### 3. State / Province Rankings
Goes below country level. For example, Germany can be split into NRW, Bavaria, Berlin, etc., while the USA has California, Texas, Florida, and so on. Pointercrate supports political subdivisions for many countries.
*Check out national rankings and regional subdivisions at [/countries](/countries).*

#### 4. Player Geolocation
Lets a player associate an approximate geographic location with their claimed profile so they can appear correctly on the map and regional rankings.
*Update your location in [/settings](/settings).*

#### 5. Advanced Stats Viewer
Provides one dedicated interface for searching players and viewing rank, score, hardest demon, Main/Extended/Legacy completions, progress, creations, publications, and verifications.
*Check platform and player stats at [/stats](/stats).*

#### 6. Completion Sorting
Lets you change how someone's completed demons are displayed—for example, alphabetically or by list position instead of always using one fixed order. Supports 6 distinct sort options, tier filters, and live search.
*Available on every player profile under [/players](/players).*

#### 7. Player Claiming
Lets you prove that an existing Demonlist player profile belongs to you and connect it to your website account.
*Initiate claiming from any player profile page at [/players](/players).*

#### 8. Player Submission Locking
After claiming your player, you can require that future records under that player name must be submitted while logged into your account. This prevents impersonation.
*Enable submission locking anytime in [/settings](/settings).*

#### 9. Under Consideration Status
Gives moderators a middle state between accepted and rejected. A suspicious or unclear record can be marked UC while staff request additional footage or investigate it.
*Visible in the moderation workflow and review queue.*

#### 10. Multiple Languages / Localization
Lets users change the entire website interface into another language. Pointercrate currently supports English and Russian and has a localization system for adding more languages.
*Toggle your preferred language in the top navigation bar.*

#### 11. Google OAuth Login
Lets users create/link an account with Google and sign in through Google rather than relying entirely on an NDL username/password.
*Available on the [/login](/login) page.*

#### 12. Automatic Geometry Dash Server Integration
Connects the list directly to GD's servers. When a level is added, the site can automatically obtain information such as its description, downloads, and other in-game metadata rather than requiring staff to enter everything manually.

#### 13. Multiple Creator Credits
Allows one level to have a proper list of all qualifying creators instead of only fields such as one nerf creator/host/verifier. This is especially useful for megacollabs.
*Displayed on level detail pages.*

#### 14. Formal Difficulty Opinion System
Collects difficulty opinions from players who have beaten a level. Staff can compare it directly against nearby levels, calculate things such as mean/median placement, remove unreliable opinions, and use the results when deciding rankings.
*Accessible to verified victors on level pages.*

#### 15. Manual Record Removal & Restoration
Lets a player request that their accepted records be removed from the leaderboard and later restored. Pointercrate also has cooldown rules to stop people abusing this.
*Manageable by record owners and staff.*

#### 16. Public Staff Directory / Roles
Clearly shows who the List Editors, List Helpers, website staff, etc. are and tells users which group to contact for things like placements, rejected records, or technical problems.
*Meet the team at [/staff](/staff).*

#### 17. Automatic Duplicate-Submission Detection
Checks whether the same record has already been submitted and rejects duplicates automatically instead of sending another identical record to moderators.

#### 18. Rich Discord Embeds
When someone posts a level/Pointercrate link in Discord, Discord can automatically show a nice preview containing useful information instead of only displaying the raw URL.

#### 19. Official Demonlist Discord Bot
Pointercrate has a public Discord bot that integrates with Demonlist data, letting Discord communities access list information without manually visiting the website. An NDL version could show rankings, player stats, level info, records, etc.
*Invite the bot and view commands at [/discord-bot](/discord-bot).*

---

### Feature Overview

| # | Feature | Status | Live Link |
| :---: | :--- | :---: | :--- |
| **1** | Public API | Live | [/api-docs](/api-docs) |
| **2** | Interactive World Map | Live | [/map](/map) |
| **3** | State / Province Rankings | Live | [/countries](/countries) |
| **4** | Player Geolocation | Live | [/settings](/settings) |
| **5** | Advanced Stats Viewer | Live | [/stats](/stats) |
| **6** | Completion Sorting | Live | [/players](/players) |
| **7** | Player Claiming | Live | [/players](/players) |
| **8** | Player Submission Locking | Live | [/settings](/settings) |
| **9** | Under Consideration Status | Live | Moderation Queue |
| **10** | Multiple Languages / Localization | Live | Header Selector |
| **11** | Google OAuth Login | Live | [/login](/login) |
| **12** | Automatic GD Server Integration | Live | Admin API |
| **13** | Multiple Creator Credits | Live | Level Pages |
| **14** | Formal Difficulty Opinion System | Live | Level Pages |
| **15** | Manual Record Removal & Restoration | Live | User Records |
| **16** | Public Staff Directory / Roles | Live | [/staff](/staff) |
| **17** | Automatic Duplicate Detection | Live | Record Submissions |
| **18** | Rich Discord Embeds | Live | OpenGraph & oEmbed |
| **19** | Official Demonlist Discord Bot | Live | [/discord-bot](/discord-bot) |

---

We're incredibly excited to bring all of this to the Nerfed Demonlist community. Have feedback, suggestions, or want to get involved? Join our [Official Discord](https://discord.gg/kyYBkQzTCq)!

*— cattw21 & The Nerfed Demonlist Team*`;

  const post = await prisma.changelogPost.upsert({
    where: { slug },
    create: {
      title,
      slug,
      category: 'ANNOUNCEMENT',
      summary,
      content,
      isPublished: true,
      isPinned: true,
      publishedAt: new Date(),
      authorId: adminUser?.id ?? null,
    },
    update: {
      title,
      category: 'ANNOUNCEMENT',
      summary,
      content,
      isPublished: true,
      isPinned: true,
      publishedAt: new Date(),
    }
  });

  console.log('Successfully published v2.0.0 roadmap news post:', post.title, `(${post.slug})`);
  console.log('NOTICE: Zero emails sent as requested.');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
