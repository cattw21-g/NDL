import type { PrismaClient } from "@/generated/prisma/client";
import { slugify } from "@/lib/slug";

export const changelogCategoryValues = [
  "ANNOUNCEMENT",
  "RANKING_UPDATE",
  "RULE_UPDATE",
  "SITE_UPDATE",
  "MODERATION_NOTE",
  "OTHER",
] as const;

export type ChangelogCategoryValue = (typeof changelogCategoryValues)[number];

export const changelogCategoryOptions = [
  { value: "ANNOUNCEMENT", label: "Announcement" },
  { value: "RANKING_UPDATE", label: "Ranking update" },
  { value: "RULE_UPDATE", label: "Rule update" },
  { value: "SITE_UPDATE", label: "Site update" },
  { value: "MODERATION_NOTE", label: "Moderation note" },
  { value: "OTHER", label: "Other" },
] as const satisfies ReadonlyArray<{
  value: ChangelogCategoryValue;
  label: string;
}>;

export function changelogCategoryLabel(value: string) {
  return (
    changelogCategoryOptions.find((option) => option.value === value)?.label ??
    "Other"
  );
}

export function normalizeChangelogSlug(input: string | undefined, title: string) {
  return slugify(input?.trim() || title);
}

export function summarizeChangelogContent(content: string, maxLength = 220) {
  const summary = content.replace(/\s+/g, " ").trim();

  if (summary.length <= maxLength) {
    return summary;
  }

  return `${summary.slice(0, maxLength - 1).trimEnd()}...`;
}

export function plainTextParagraphs(content: string) {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export const LATEST_RELEASE_POST = {
  title: "Nerfed Demonlist v1.0.0: Official Stable Release",
  slug: "ndl-v1-0-0-official-stable-release",
  category: "ANNOUNCEMENT" as const,
  summary:
    "Nerfed Demonlist has officially graduated out of Release Candidate into our v1.0.0 Stable Release! Featuring Main List & Extended List tiers (#1–75 / #76–150), partial progress scoring, Country Rankings, Creator Leaderboards, historical List Archive, Level Position History, and a complete site-wide modern redesign.",
  content: `Hey everyone!

Today marks a huge milestone for Nerfed Demonlist: we are officially moving out of Release Candidate status and launching **Nerfed Demonlist v1.0.0 Stable**!

Over the past few weeks we've been working non-stop on all of this to turn NDL into a complete, high-quality demonlist with everything you'd expect and more.

Here is everything included in the official v1.0.0 release:

### 1. Main List (#1–75) & Extended List (#76–150)
The list is now structured into three clear competitive tiers:
- **Main List (#1–75)**: The hardest nerfed extreme demons. Main list runs are eligible for partial progress points.
- **Extended List (#76–150)**: Secondary competitive bracket. Only 100% completions award points.
- **Legacy List**: Demons ranked #151+ or historically archived.

### 2. Partial Points for Qualifying Progress Runs
You no longer walk away empty-handed after putting up massive progress on top demons! If you score a qualifying run (e.g. 50%+) on any Main List level, you now earn partial leaderboard points scaled to the level's rank and how far past the requirement you reached.

### 3. Country Rankings & Continental Maps
Check out the **Countries** tab to see how nations around the world rank by total player points. You can filter by continent (Europe, North America, South America, Asia, Oceania, Africa) and click into any country to inspect its national roster and top victors.

### 4. Creator Leaderboards
We added a dedicated **Creators** tab to celebrate the architects who build, publish, and verify nerfed demons, awarding creator points based on level difficulty.

### 5. Historical List Archive
Curious what the list looked like weeks ago or at launch? The **Archive** tab lets you pick any date on the calendar and instantly reconstruct the exact rankings, points, and player leaderboards as of that day.

### 6. Level Position History & Peak Ranks
Every level detail page now features an interactive **Position History** timeline showing placement dates, rank shifts (rises and drops), and the level's all-time Peak Rank badge.

### 7. Deep Geometry Dash Metadata
Levels now display Newgrounds song titles and direct links, song IDs, object counts, level lengths, in-game difficulties, copy passwords, and minimum qualifying progress.

### 8. Site-Wide Modern Redesign & Clean Navigation
The entire site has been redesigned with sleek gradient hero banners, unified pill button controls, responsive 2-tier header navigation, and clean tables across every page.

We put a ton of hard work into getting everything ready for this release. Enjoy the v1.0.0 update, and we'll see you on the leaderboard!

*— cattw21 & NDL Staff*`,
};

export const V1_5_ANNOUNCEMENT_POST = {
  title: "Nerfed Demonlist v1.5.0 is Live!",
  slug: "nerfed-demonlist-v1-5-0-official-release",
  category: "ANNOUNCEMENT" as const,
  summary:
    "Welcome to the official v1.5.0 release of Nerfed Demonlist! We’ve delivered complete Pointercrate parity: Interactive World Map with State Subdivisions, Guest Submissions, Public Read & Write REST API, Video Normalization, Opinion Statistics, Partial Points Previews, GD Download Counts, 72-Hour Timeouts, Central America Filters, and much more.",
  content: `## 🗺️ Geographic & International Rankings
[MAP] **Interactive World Map**: Leaderboard activity is now displayed geographically right inside the [Countries](/countries) tab! Nations with registered players are shaded in vibrant blue based on total points, while the nation hosting the world's **#1 Top Player** is crowned in glowing golden yellow 👑.
[SUBDIVISIONS] **States & Provinces Drawn Directly on the Map**: Toggle between Countries and Subdivision view on the world map! Over 720 states, provinces, and territories (US states, Canadian provinces, Australian states, etc.) are drawn and independently interactive with hover tooltips and regional filtering.
[FILTER] **Central America Region Filter**: Added Central America to continent filters across the international leaderboard and [Stats](/stats) page, spotlighting victors across Costa Rica, Panama, Guatemala, Honduras, El Salvador, Nicaragua, and Belize.
[GEOLOCATION] **One-Click IP Auto-Detection**: Select your nation instantly in [Settings](/settings) with the new **Auto-Detect from IP** button without scrolling through 250 nations.

## ⚡ Guest Submissions & REST API Ecosystem
[GUEST] **Guest Record Submissions**: You no longer need to create an account before submitting! Players can submit records directly on [/submit](/submit) by typing their Geometry Dash username.
[SECURITY] **Submission Locking**: Protect your name and legacy! Verified account owners can enable **Submission Locking** in [Settings](/settings) to prevent unauthenticated guests from submitting runs under their name.
[API] **Authenticated & Write REST API**: Developers and bot creators can now submit records programmatically via \`POST /api/public/records/submit\` using session Bearer tokens or guest payloads.
[DOCS] **Official Public REST API & Developer Portal**: Complete public GET/POST endpoints for demons, players, rankings, records, rules, and changelog with interactive documentation live at [/api-docs](/api-docs).
[VALIDATOR] **Automatic Video-Link Validation & Normalization**: The submission system automatically strips tracking parameters (\`si=\`, \`feature=\`, \`fbclid=\`, \`utm_*\`) and canonicalizes YouTube Shorts, embeds, and mobile links into standard watch URLs, supporting YouTube, Twitch, Medal.tv, Bilibili, TikTok, and Streamable.

## 📊 Deep Level Analytics & Scoring Previews
[PREVIEW] **Partial-Score Points Preview**: Level pages now display the exact leaderboard points awarded for 100% completions alongside minimum qualifying progress runs (e.g. 100%: 1000 pts | 50%+: 100 pts), with list tier guidelines and scoring breakdowns.
[STATS] **In-Game GD Downloads & Likes**: Level pages now display live Geometry Dash download counts and like tallies synced directly from Geometry Dash servers.
[CONSENSUS] **Advanced Difficulty-Opinion Statistics**: Pointercrate-parity victor opinion analysis! Level pages compute **Median Suggested Rank**, **Trimmed Mean** (discarding 15% extreme placement outliers), **Consensus Reliability Index** (confidence percentage), and **Placement Brackets** (e.g. #10 – #12).
[VIEWER] **Advanced Stats Viewer**: Dedicated analytics suite at [/stats](/stats) to filter players, national representation, and list records by rank, country, and status.

## 🛡️ Moderation System & Community Tools
[TIMEOUT] **72-Hour Evidence Request Deadline**: Submissions placed **Under Consideration** or **Needs Changes** now feature an automated 3-day (72-hour) countdown timer. Submissions with unprovided evidence are automatically archived to keep the review queue fast and responsive.
[QUEUE] **Under Consideration (UC) Moderation Queue**: A dedicated review state for records undergoing deep verification, raw footage analysis, or click audio inspection.
[CLAIM] **Player Profile Claiming**: Verify ownership of your Geometry Dash runner profile and connect it directly to your website account from any player page at [/players](/players).
[SORT] **6-Way Completion Sorting**: Sort player profile completions alphabetically, by list rank, by points, or by date, complete with Main/Extended tier toggles and instant search.
[BOT] **Official Discord Bot Integration**: Connect with the NDL Discord bot for real-time \`/top\`, \`/level\`, \`/player\`, \`/leaderboard\`, \`/rules\`, and \`/changelog\` queries, paired with 24/7 automated acceptance alerts. Check out [/discord-bot](/discord-bot) to invite the bot.
[STAFF] **Public Staff Directory & Hierarchy**: Browse list editors, helper teams, and administrators with clear contact instructions at [/staff](/staff).

---

We put a ton of hard work into getting everything ready for this release. Enjoy the v1.5.0 update, and we'll see you on the leaderboard!

*— cattw21 & NDL Staff*`,
};

export const V1_6_0_ANNOUNCEMENT_POST = {
  title: "NDL v1.6.0",
  slug: "ndl-v1-6-0",
  category: "ANNOUNCEMENT" as const,
  summary:
    "NDL v1.6.0 is live! Featuring a redesigned Demonlist browsing experience with large high-quality thumbnails, dramatically faster image loading, outage fallback resilience, smart anti-alt and top-10 moderation safeguards, record restoration, and site-wide mobile polish.",
  content: `Hey everyone!

**NDL v1.6.0 is officially here!** 🎉

Over the past few days, we’ve put a massive amount of care into making Nerfed Demonlist faster, cleaner, more reliable, and better to use across every device. This update brings a refined Demonlist presentation with larger previews, major image optimization and speed upgrades, intelligent moderation safeguards, background resilience during outages, and countless quality-of-life polish items.

Here is everything included in the official v1.6.0 release:

---

### 🏆 Demonlist & Browsing Experience
- **Reworked Level Card Presentation**: Level cards now feature larger, prominent 16:9 thumbnails, high-visibility rank badges, and a cleaner information hierarchy inspired by classic demonlist layouts.
- **Refined Filtering & Search Controls**: Decluttered the list toolbar by removing redundant sort options and duplicate filter chips, making it faster and easier to find exactly the demons you're looking for.
- **Reworked Upcoming Demons View**: Updated the Upcoming tab with clearer verification status badges, progress tracking indicators, and cleaner metadata.
- **Smoother Navigation**: Refined sticky jump bars and header controls with smoother scrolling, tighter spacing, and cleaner transitions.

---

### ⚡ Performance & Image Delivery
- **Optimized Level Thumbnails**: Migrated all level thumbnails to modern, responsive image delivery (AVIF and WebP). Instead of downloading multi-megabyte source images, your browser now receives crisp, lightweight images sized specifically for your screen—drastically reducing data usage and loading cards nearly instantly.
- **Faster Initial Page Loads**: Added priority preloading to top demon previews so the homepage and list render immediately without layout jumps.
- **Optimized Public Page Caching**: Reworked caching across the Demonlist, Leaderboards, Stats, and Countries, enabling pages to load faster with less server overhead.
- **Reduced Background Network Activity**: Made real-time background sync smarter and quieter, automatically pausing unnecessary requests when browser tabs are inactive.

---

### 🛡️ Moderation & Record Management
- **Added Anti-Alt & Conflict Detection**: Moderators now have automated conflict detection tools to identify potential duplicate accounts or ban evasions during record reviews, keeping rankings fair and transparent.
- **Added Top 10 Verification Safeguards**: High-profile runs on top 10 demons now pass through dedicated verification gates requiring additional review before acceptance.
- **Added Structured Rejection Notes**: When a submission cannot be accepted, moderators can now provide clear, categorized explanations so players receive helpful feedback on what needs fixing.
- **Added Record Restoration Tools**: Implemented reversible record management so mistakenly deleted or modified records can be recovered safely without data loss.

---

### 🔒 Security & Site Reliability
- **Outage Fallback Resilience**: Added a durable fallback system. If our database encounters temporary maintenance or connection limits, the Demonlist automatically serves a verified snapshot so you can continue browsing rankings and level details seamlessly without downtime.
- **Strengthened Anti-Abuse Protections**: Upgraded request rate limiting across login, record submissions, and voting to protect the community against spam and automated abuse.
- **Hardened Administrative Safeguards**: Added emergency rollback tools and tamper-resistant audit logging with automatic redaction of sensitive credentials.

---

### 📱 Mobile & Accessibility
- **Improved Mobile Responsiveness**: Tailored layout spacing, card padding, and button hit targets specifically for mobile devices and tablets, ensuring a smooth experience whether you're on a phone or desktop.
- **Enhanced Accessibility**: Improved screen reader labels, keyboard focus rings, and contrast across badges and navigation links.

---

### 🛠️ Bug Fixes & Refinements
- **Video Link Handling**: Refined video URL validation and playback normalization for edge cases on YouTube and Twitch.
- **Submission Status Sync**: Fixed an issue where recent submission statuses in user menus did not always update immediately after moderator review.
- **Leaderboard Performance**: Improved memory and query efficiency on high-volume player rankings.

---

Thank you for being part of Nerfed Demonlist and supporting the project. Good luck on your grinds, and we'll see you on the leaderboard!

*— cattw21 & NDL Staff*`,
};

export const V1_5_1_ANNOUNCEMENT_POST = {
  title: "Nerfed Demonlist v1.5.1: Bug Fixes, System Safety & Future Mods",
  slug: "nerfed-demonlist-v1-5-1-bug-fixes-and-safety",
  category: "ANNOUNCEMENT" as const,
  summary:
    "v1.5.1 is live! We've fixed UI and system bugs, added smooth loading skeletons and crash recovery, clarified mandatory microphone/audio rules for legitimate records, strengthened backend security to protect user accounts and logs, and prepared our safety infrastructure as we gear up to onboard community moderators soon!",
  content: `Hey everyone!

Welcome to **Nerfed Demonlist v1.5.1**! Today's update brings a wave of polish, bug fixes, quality-of-life upgrades, enhanced background safety features, and exciting news regarding the future of the NDL moderation team.

---

### 🛠️ Simplified Bug Fixes & UX Upgrades
- **Crash-Proof Error Recovery**: We added custom, friendly error screens across the entire site. If an unexpected connection hiccup occurs, you won't get a blank page or be stuck—simply hit the "Reload application" button to recover safely.
- **Smooth Loading Skeletons**: You will now see smooth animated loading placeholders when navigating between the ranked list, level pages, player leaderboards, stats, and upcoming demons, eliminating awkward visual jumps.
- **Snappier & More Responsive Navigation**: Improved mobile layouts, link transitions, and fast client-side syncing across the entire site.

---

### 🎙️ Record Submissions: Microphone / Click Audio Requirement
A quick and very important reminder for all runners submitting records:
- **Microphone / click audio is strictly required for legitimate record verification.**
- We have been receiving a high volume of submissions with missing or completely muted audio. To keep the list fair, authentic, and protected against illegitimate runs, **all completions and qualifying progress runs must have clearly audible clicks/taps** in your video or raw footage. Silent submissions will not be accepted.

---

### 🛡️ System Safety & Preparing for Future Moderators
We have implemented extensive backend security and safety systems across the website:
- **Comprehensive Activity Auditing**: Every moderation action, record review, and suggestion update is now permanently logged and traceable to prevent abuse or unauthorized tampering.
- **Hardened Account Protections**: Added robust security barriers safeguarding player records, user profiles, and sensitive actions.
- **Why this matters**: In the future, we will be opening up moderator positions so trusted community members can help accept records and manage the list. These safety systems ensure the website remains 100% secure, transparent, and protected for everyone, regardless of team size.

---

### 👥 What's Next: Community Moderators Coming Soon!
With our new safety foundations and security tools ready, we're getting set for the next chapter:
- **We will soon begin looking for active, trusted members of the community to join the team as List Moderators!**
- Mods will help review and accept record submissions and level suggestions so everything stays fast and organized.
- Stay tuned to our announcements channel for upcoming details on moderator applications and how you can get involved.

Thank you all for your continuous support, good luck on your grinds, and we'll see you on the leaderboard!

*— cattw21 & NDL Staff*`,
};

export const REVIEW_PAUSE_SEPT_2026_POST = {
  title: "Records & Suggestions Update: Review Pause (13/09 – 20/09)",
  slug: "records-suggestions-pause-september-2026",
  category: "MODERATION_NOTE" as const,
  summary:
    "I'm going on a trip for a week, so record submissions and level suggestions won't be reviewed until 20/09/26. Submissions will remain open and queued up in the meantime! And no, I will not make anyone mod while I'm gone.",
  content: `Hey everyone!

Quick heads-up: I'm going to be away on a trip for a week starting today, so I won't be able to review any record submissions or level suggestions on the website until **20/09/26** (September 20th).

### What you need to know:
- **Submissions remain open**: You can still play, practice, and submit your records and level suggestions normally.
- **Queue stays safe**: All submitted runs and level suggestions will stay safely saved in the queue while I'm away.
- **No temporary mods**: And no, I will not make anyone mod while I'm gone (because I'm sure people will ask "can I be mod so I can manage it while you're away" lol, the answer is no). Everything will just wait until I get back.
- **Catch-up upon return**: As soon as I get back on September 20th, I'll go through the entire backlog and review everything.

Thanks for your patience and understanding, keep having fun, and good luck beating levels on NDL!

*— cattw21*`,
};

export const STAFF_APPLICATIONS_OPEN_POST = {
  title: "Staff Applications Are Open: List Reviewers & Beta Testers Wanted!",
  slug: "staff-applications-open",
  category: "ANNOUNCEMENT" as const,
  summary:
    "Staff applications for Nerfed Demonlist are officially open! We are looking for active, dedicated community members to join the team as List Reviewers and Beta Testers. Check out the requirements, expectations, and apply today.",
  content: `Hey everyone!

We are excited to announce that **Nerfed Demonlist Staff Applications are officially open**! 🎉

As the list and community continue to grow, we are expanding our team to keep verification fast, fair, and thorough, and to ensure upcoming features are rigorously tested before public release.

We are currently recruiting for two key roles (plus List Moderator):

---

### 📋 Open Positions

#### 1. List Reviewer
- **Responsibilities**: Review incoming record submissions, verify completion videos, inspect click audio, check FPS/TPS guidelines, and maintain quick queue turnaround times.
- **Requirements**:
  - Deep familiarity with NDL verification guidelines and proof standards.
  - Objective, unbiased, and patient attitude when evaluating player runs.
  - Active Discord presence and regular availability.
- **Apply Here**: [List Reviewer Application](/applications/list-reviewer)

#### 2. Beta Tester
- **Responsibilities**: Test upcoming features, try new redesigns and tools early, test responsive layouts across different mobile/desktop browsers, and submit structured bug reports.
- **Requirements**:
  - Willingness to test experimental features and provide clear, actionable feedback.
- **Apply Here**: [Beta Tester Application](/applications/beta-tester)

#### 3. List Moderator
- For experienced community members ready to assist with dispute resolution, complex run evaluations, and queue management: [List Moderator Application](/applications/list-moderator)

---

### 🚀 How to Apply

1. Click the **Apply** button in the top navigation bar or the **Staff Applications Open** banner on the homepage.
2. Sign in or register your NDL account.
3. Select the position you wish to apply for (**List Reviewer** or **Beta Tester**).
4. Fill out the application form—your answers autosave automatically as you type!
5. Submit your application. You can track your application status at any time under [My Applications](/applications/mine).

We're looking forward to reading your applications and welcoming new team members to NDL!

*— cattw21 & NDL Staff*`,
};

export const DEFAULT_POSTS = [
  {
    id: "staff-applications-open",
    title: STAFF_APPLICATIONS_OPEN_POST.title,
    slug: STAFF_APPLICATIONS_OPEN_POST.slug,
    category: STAFF_APPLICATIONS_OPEN_POST.category,
    summary: STAFF_APPLICATIONS_OPEN_POST.summary,
    content: STAFF_APPLICATIONS_OPEN_POST.content,
    isPinned: true,
    isPublished: true,
    isDemo: false,
    publishedAt: new Date("2026-09-24T11:40:00.000Z"),
    updatedAt: new Date("2026-09-24T11:40:00.000Z"),
    archivedAt: null,
    author: { displayName: "cattw21" },
  },
  {
    id: "ndl-v1-6-0",
    title: V1_6_0_ANNOUNCEMENT_POST.title,
    slug: V1_6_0_ANNOUNCEMENT_POST.slug,
    category: V1_6_0_ANNOUNCEMENT_POST.category,
    summary: V1_6_0_ANNOUNCEMENT_POST.summary,
    content: V1_6_0_ANNOUNCEMENT_POST.content,
    isPinned: false,
    isPublished: true,
    isDemo: false,
    publishedAt: new Date("2026-09-23T20:00:00.000Z"),
    updatedAt: new Date("2026-09-23T20:00:00.000Z"),
    archivedAt: null,
    author: { displayName: "cattw21" },
  },
  {
    id: "nerfed-demonlist-v1-5-1-bug-fixes-and-safety",
    title: V1_5_1_ANNOUNCEMENT_POST.title,
    slug: V1_5_1_ANNOUNCEMENT_POST.slug,
    category: V1_5_1_ANNOUNCEMENT_POST.category,
    summary: V1_5_1_ANNOUNCEMENT_POST.summary,
    content: V1_5_1_ANNOUNCEMENT_POST.content,
    isPinned: false,
    isPublished: true,
    isDemo: false,
    publishedAt: new Date("2026-09-22T20:30:00.000Z"),
    updatedAt: new Date("2026-09-22T20:30:00.000Z"),
    archivedAt: null,
    author: { displayName: "cattw21" },
  },
  {
    id: "records-suggestions-pause-september-2026",
    title: REVIEW_PAUSE_SEPT_2026_POST.title,
    slug: REVIEW_PAUSE_SEPT_2026_POST.slug,
    category: REVIEW_PAUSE_SEPT_2026_POST.category,
    summary: REVIEW_PAUSE_SEPT_2026_POST.summary,
    content: REVIEW_PAUSE_SEPT_2026_POST.content,
    isPinned: false,
    isPublished: true,
    isDemo: false,
    publishedAt: new Date("2026-09-13T19:00:00.000Z"),
    updatedAt: new Date("2026-09-13T19:00:00.000Z"),
    archivedAt: null,
    author: { displayName: "cattw21" },
  },
  {
    id: "nerfed-demonlist-v1-5-0-official-release",
    title: V1_5_ANNOUNCEMENT_POST.title,
    slug: V1_5_ANNOUNCEMENT_POST.slug,
    category: V1_5_ANNOUNCEMENT_POST.category,
    summary: V1_5_ANNOUNCEMENT_POST.summary,
    content: V1_5_ANNOUNCEMENT_POST.content,
    isPinned: false,
    isPublished: true,
    isDemo: false,
    publishedAt: new Date("2026-09-06T11:00:00.000Z"),
    updatedAt: new Date("2026-09-06T11:00:00.000Z"),
    archivedAt: null,
    author: { displayName: "cattw21" },
  },
  {
    id: "major-update-tiers-countries-archive-partial-points",
    title: "Nerfed Demonlist v1.0.0: Official Stable Release",
    slug: "major-update-tiers-countries-archive-partial-points",
    category: "ANNOUNCEMENT" as const,
    summary:
      "Nerfed Demonlist has officially graduated out of Release Candidate into our v1.0.0 Stable Release! Featuring Main List & Extended List tiers (#1–75 / #76–150), partial progress scoring, Country Rankings, Creator Leaderboards, historical List Archive, Level Position History, and a complete site-wide modern redesign.",
    content: LATEST_RELEASE_POST.content,
    isPinned: false,
    isPublished: true,
    isDemo: false,
    publishedAt: new Date("2026-09-05T12:00:00.000Z"),
    updatedAt: new Date("2026-09-05T12:00:00.000Z"),
    archivedAt: null,
    author: { displayName: "cattw21" },
  },
  {
    id: "official-discord-server-and-bot-launched",
    title: "🎉 Official Nerfed Demonlist Discord Server & Bot is Live!",
    slug: "official-discord-server-and-bot-launched",
    category: "ANNOUNCEMENT" as const,
    summary:
      "We are thrilled to officially launch the Nerfed Demonlist Discord Server, featuring 24/7 automated record broadcasts, live bot commands, interactive role selection, and an active community hub for Geometry Dash nerfed extremes!",
    content: `## Welcome to the Official Nerfed Demonlist Community!

We are excited to announce that the **Official Nerfed Demonlist Discord Server & Bot** is now fully launched and open to the entire Geometry Dash community!

### 🌟 What's New in the Server?
- **🔴 24/7 Live Website Auto-Broadcasting**: All newly accepted list records, upcoming demon previews, and list updates are automatically broadcast directly to our Discord channels in real-time!
- **🤖 High-Powered Bot Commands**: Use \`/top\`, \`/level\`, \`/player\`, \`/leaderboard\`, \`/rules\`, and \`/changelog\` directly inside Discord to pull live data from the website.
- **🎭 Self-Assignable Notification Roles**: Check out the \`#🎭・roles\` channel to click and toggle \`🔔 Announcements Ping\` and \`📰 List Updates Ping\` with zero hassle.
- **💬 Active Community & Demon Discussion**: Dedicated channels for sharing your progress runs, click audio showcases, nerfed demon balance discussions, and creative artwork.

### 🔗 Join the Server Now
Click the Discord icon at the top of the website or join via our direct server link:
**[Join the Official Nerfed Demonlist Discord](https://discord.gg/kyYBkQzTCq)**

Thank you for your incredible support as we continue pushing the limits of nerfed demon tracking!

*— The Nerfed Demonlist Team & @cattw_gd*`,
    isPinned: false,
    isPublished: true,
    isDemo: false,
    publishedAt: new Date("2026-08-24T22:00:00.000Z"),
    updatedAt: new Date("2026-08-24T22:00:00.000Z"),
    archivedAt: null,
    author: { displayName: "cattw21" },
  },
  {
    id: "rc-v1-release",
    title: "Nerfed Demonlist v1.0 Release Candidate is Live!",
    slug: "ndl-v1-0-rc-release",
    category: "SITE_UPDATE" as const,
    summary:
      "Welcome to the official Release Candidate of Nerfed Demonlist (v1.0-RC)! We’ve completely overhauled the platform with the new Upcoming Levels tab (Currently Verifying & Waiting Levels), universal video playback for Medal.tv & TikTok, player profile champion banners, global member search, Top 50 leaderboards, and instant navigation.",
    content: LATEST_RELEASE_POST.content,
    isPinned: false,
    isPublished: true,
    isDemo: false,
    publishedAt: new Date("2026-08-21T21:20:00.000Z"),
    updatedAt: new Date("2026-08-21T21:20:00.000Z"),
    archivedAt: null,
    author: { displayName: "cattw21" },
  },
  {
    id: "records-suggestions-update",
    title: "Records & Suggestions Update",
    slug: "records-suggestions-update",
    category: "MODERATION_NOTE" as const,
    summary:
      "Records and suggestions will not be reviewed until 17/08/26 as we work on an upcoming update and our new Discord server.",
    content: `Hey everyone!

Just a quick update: Records and Suggestions will not be reviewed until 17/08/26 while we focus on preparing our upcoming update and getting the new Discord server ready.

We appreciate your patience and understanding while we work on everything behind the scenes. In the meantime, keep playing, have fun, and good luck trying to beat the levels on NDL!

More updates will be shared soon, so stay tuned!`,
    isPinned: false,
    isPublished: true,
    isDemo: false,
    publishedAt: new Date("2026-08-13T19:52:00.000Z"),
    updatedAt: new Date("2026-08-13T19:52:00.000Z"),
    archivedAt: null,
    author: { displayName: "cattw21" },
  },
  {
    id: "ndl-public-beta-is-live",
    title: "NDL public beta is live",
    slug: "ndl-public-beta-is-live",
    category: "ANNOUNCEMENT" as const,
    summary:
      "Nerfed Demonlist is open for public beta with ranked levels, record submissions, level suggestions, rules, and staff review.",
    content: `NDL is now ready for public beta. Players can view ranked nerfed demon versions, submit records for review, suggest new level candidates, and read the official v1.0 rules. Staff will continue to review submissions, tune rankings, and publish updates as the list grows.`,
    isPinned: false,
    isPublished: true,
    isDemo: false,
    publishedAt: new Date("2026-06-01T00:00:00.000Z"),
    updatedAt: new Date("2026-06-03T16:15:00.000Z"),
    archivedAt: null,
    author: { displayName: "NDL Staff" },
  },
];

export async function ensureLatestChangelogPost(prismaClient: PrismaClient) {
  try {
    await prismaClient.changelogPost.deleteMany({
      where: {
        OR: [
          { slug: "nerfed-demonlist-v2-0-0-official-roadmap" },
          { title: { contains: "v2.0.0" } },
        ],
      },
    });

    for (const post of DEFAULT_POSTS) {
      await prismaClient.changelogPost.upsert({
        where: { slug: post.slug },
        update: {
          title: post.title,
          category: post.category,
          summary: post.summary,
          content: post.content,
          isPublished: true,
          isPinned: post.isPinned,
          isDemo: false,
          archivedAt: null,
        },
        create: {
          title: post.title,
          slug: post.slug,
          category: post.category,
          summary: post.summary,
          content: post.content,
          isPublished: true,
          isPinned: post.isPinned,
          isDemo: false,
          publishedAt: post.publishedAt,
        },
      });
    }

    await prismaClient.changelogPost.updateMany({
      where: {
        slug: { not: STAFF_APPLICATIONS_OPEN_POST.slug },
        isPinned: true,
      },
      data: {
        isPinned: false,
      },
    });
  } catch {
    // Fail-safe
  }
}
