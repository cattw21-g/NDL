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

  const slug = 'nerfed-demonlist-v2-0-0-official-roadmap';
  const title = 'Nerfed Demonlist v2.0.0: The Future of NDL (Official Roadmap)';
  const summary = 'Announcing the official development roadmap for Nerfed Demonlist v2.0.0, featuring 19 generational upgrades including a Public API, Interactive World Map, Subdivisions, Player Claiming, and more.';

  const content = `Following the successful launch of **Nerfed Demonlist v1.0.0 Stable**, the NDL team is thrilled to unveil our official development roadmap for **Nerfed Demonlist v2.0.0**!

This generational milestone brings full competitive feature parity with the Geometry Dash demonlist ecosystem while introducing custom features engineered specifically for nerfed demons.

---

### The 19 Planned Upgrades for v2.0.0

#### 1. Official Public API
Gives community developers, Discord bot creators, and external websites an official REST API to query demons, accepted records, rankings, and player standings in real-time.

#### 2. Interactive World Map
Displays global demonlist activity geographically. Countries and territories will be shaded by national points, allowing users to interactively explore international communities.

#### 3. State & Province Rankings (Regional Subdivisions)
Drills below country level into states, provinces, and regional territories (e.g., US states like California, Texas, Florida, and German states like Bavaria, NRW, Berlin).

#### 4. Player Geolocation & Regional Identity
Enables claimed players to associate an approximate geographic region with their profile, seamlessly integrating them into regional and state rankings.

#### 5. Advanced Stats Viewer
A dedicated statistics interface for exploring players, featuring deepest completion analytics: Main List (#1–75), Extended List (#76–150), Legacy, hardest demon completed, creations, and verifications.

#### 6. Dynamic Completion Sorting
Sort any player's completed demons by list rank, completion date (newest/oldest), alphabetical name, or points awarded.

#### 7. Player Claiming
Link an existing Demonlist player identity directly to your website user account through verified authentication proof.

#### 8. Player Submission Locking
Claimed players can enable submission locking, requiring that future record submissions under their name be submitted while logged into their verified account to prevent impersonation.

#### 9. "Under Consideration" (UC) Record Status
Provides moderators with an intermediate status between accepted and rejected. Suspicious or borderline runs can be marked UC while staff request additional raw footage or conduct click analysis.

#### 10. Multiple Languages & Localization (i18n)
Native multi-language support (English, Russian, Spanish, German, Polish) with a persistent header language selector.

#### 11. Google OAuth Authentication
Sign in or link your NDL profile using your Google account in addition to standard credentials and Discord linking.

#### 12. Automatic Geometry Dash Server Integration
Connects directly to Geometry Dash servers using level IDs to automatically sync in-game metadata, descriptions, object counts, and song details without manual staff entry.

#### 13. Multiple Creator Credits (Megacollabs)
Support for multiple creator credits with specific contribution roles (Host, Nerfer, Decorator, Verifier) for megacollabs.

#### 14. Formal Difficulty Opinion System
Collects structured difficulty ratings and placement opinions from verified victors to calculate mean/median difficulty curves for list placements.

#### 15. Manual Record Removal & Restoration
Enables players to temporarily unlist accepted records from public rankings and later restore them, protected by abuse-prevention cooldowns.

#### 16. Public Staff Directory & Roles
A dedicated public staff page outlining active Administrators, List Editors, List Helpers, and Verifiers, with clear contact channels for placements and appeals.

#### 17. Automatic Duplicate-Submission Detection
Automatic detection and rejection of identical video URLs or redundant submissions before they enter the moderation queue.

#### 18. Rich Discord Embeds
Dynamic OpenGraph and oEmbed cards showing level thumbnails, rank badges, points, creators, and verifiers whenever links are shared on Discord.

#### 19. Official Demonlist Discord Bot
A public Discord bot for server communities, enabling real-time slash command lookups for rankings, player statistics, and level records.

---

### What's Next?
Development on these features is rolling out in continuous phases. Stay tuned for preview releases and feature drops in upcoming changelogs!`;

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
