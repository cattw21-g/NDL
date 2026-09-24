import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { APPLICATION_TEMPLATES } from "../src/lib/application-templates";
import { hashSessionToken } from "../src/lib/auth";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://ndl:ndl_dev_password@localhost:5432/ndl?schema=public";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

export const ADMIN_SESSION_TOKEN = "video_admin_token_0000000000000000";
export const APPLICANT_AERO_TOKEN = "video_applicant_aero_00000000000";
export const APPLICANT_NEXUS_TOKEN = "video_applicant_nexus_0000000000";
const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012";

async function main() {
  console.log("Seeding realistic demo data for video recording...");

  // 1. Admin user (CattW)
  const admin = await prisma.user.upsert({
    where: { playerName: "cattw" },
    update: {
      role: "ADMIN",
      email: "cattwgd@gmail.com",
      displayName: "CattW",
      playerName: "cattw",
      emailVerifiedAt: new Date(),
    },
    create: {
      playerName: "cattw",
      displayName: "CattW",
      email: "cattwgd@gmail.com",
      passwordHash: DUMMY_HASH,
      role: "ADMIN",
      emailVerifiedAt: new Date(),
    },
  });

  const adminTokenHash = hashSessionToken(ADMIN_SESSION_TOKEN);
  await prisma.session.deleteMany({ where: { tokenHash: adminTokenHash } });
  await prisma.session.create({
    data: {
      userId: admin.id,
      tokenHash: adminTokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // 2. Applicant AeroGD (Submitted status for /applications/mine)
  const aero = await prisma.user.upsert({
    where: { playerName: "aerogd" },
    update: {
      role: "PLAYER",
      email: "aerogd@gmail.com",
      displayName: "AeroGD",
      playerName: "aerogd",
      emailVerifiedAt: new Date(),
    },
    create: {
      playerName: "aerogd",
      displayName: "AeroGD",
      email: "aerogd@gmail.com",
      passwordHash: DUMMY_HASH,
      role: "PLAYER",
      emailVerifiedAt: new Date(),
    },
  });

  const aeroTokenHash = hashSessionToken(APPLICANT_AERO_TOKEN);
  await prisma.session.deleteMany({ where: { tokenHash: aeroTokenHash } });
  await prisma.session.create({
    data: {
      userId: aero.id,
      tokenHash: aeroTokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // 3. Applicant NexusGD (Draft status for form typing and autosave)
  const nexus = await prisma.user.upsert({
    where: { playerName: "nexusgd" },
    update: {
      role: "PLAYER",
      email: "nexusgd@gmail.com",
      displayName: "NexusGD",
      playerName: "nexusgd",
      emailVerifiedAt: new Date(),
    },
    create: {
      playerName: "nexusgd",
      displayName: "NexusGD",
      email: "nexusgd@gmail.com",
      passwordHash: DUMMY_HASH,
      role: "PLAYER",
      emailVerifiedAt: new Date(),
    },
  });

  const nexusTokenHash = hashSessionToken(APPLICANT_NEXUS_TOKEN);
  await prisma.session.deleteMany({ where: { tokenHash: nexusTokenHash } });
  await prisma.session.create({
    data: {
      userId: nexus.id,
      tokenHash: nexusTokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // 4. Candidate VortexGD
  const vortex = await prisma.user.upsert({
    where: { playerName: "vortexgd" },
    update: {
      role: "PLAYER",
      displayName: "VortexGD",
      playerName: "vortexgd",
      emailVerifiedAt: new Date(),
    },
    create: {
      playerName: "vortexgd",
      displayName: "VortexGD",
      email: "vortexgd@demonlist.local",
      passwordHash: DUMMY_HASH,
      role: "PLAYER",
      emailVerifiedAt: new Date(),
    },
  });

  // 5. Candidate Solaris_GD
  const solaris = await prisma.user.upsert({
    where: { playerName: "solaris_gd" },
    update: {
      role: "PLAYER",
      displayName: "Solaris_GD",
      playerName: "solaris_gd",
      emailVerifiedAt: new Date(),
    },
    create: {
      playerName: "solaris_gd",
      displayName: "Solaris_GD",
      email: "solaris@demonlist.local",
      passwordHash: DUMMY_HASH,
      role: "PLAYER",
      emailVerifiedAt: new Date(),
    },
  });

  // 6. Candidate NovaGD (for Accept & Grant Role)
  const nova = await prisma.user.upsert({
    where: { playerName: "novagd" },
    update: {
      role: "PLAYER",
      displayName: "NovaGD",
      playerName: "novagd",
      emailVerifiedAt: new Date(),
    },
    create: {
      playerName: "novagd",
      displayName: "NovaGD",
      email: "novagd@demonlist.local",
      passwordHash: DUMMY_HASH,
      role: "PLAYER",
      emailVerifiedAt: new Date(),
    },
  });

  // Ensure Openings
  for (const tmpl of Object.values(APPLICATION_TEMPLATES)) {
    const opening = await prisma.applicationOpening.upsert({
      where: { slug: tmpl.slug },
      update: {
        title: tmpl.title,
        role: tmpl.role,
        description: tmpl.description,
        requirements: JSON.stringify(tmpl.requirements),
        status: "OPEN",
        isPublished: true,
        maxPositions: tmpl.defaultMaxPositions ?? 5,
        createdById: admin.id,
      },
      create: {
        slug: tmpl.slug,
        title: tmpl.title,
        role: tmpl.role,
        description: tmpl.description,
        requirements: JSON.stringify(tmpl.requirements),
        status: "OPEN",
        isPublished: true,
        maxPositions: tmpl.defaultMaxPositions ?? 5,
        createdById: admin.id,
      },
    });

    await prisma.applicationQuestion.deleteMany({
      where: { openingId: opening.id },
    });

    for (const q of tmpl.questions) {
      await prisma.applicationQuestion.create({
        data: {
          openingId: opening.id,
          order: q.order,
          prompt: q.prompt,
          description: q.description || null,
          type: q.type,
          required: q.required,
          options: q.options ? JSON.stringify(q.options) : null,
          placeholder: q.placeholder || null,
          minLength: q.minLength || null,
          maxLength: q.maxLength || null,
        },
      });
    }

    console.log(`✓ Opening ${tmpl.title} synced (${tmpl.questions.length} questions)`);
  }

  // Seed Submissions for List Reviewer
  const reviewerOpening = await prisma.applicationOpening.findUnique({
    where: { slug: "list-reviewer" },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  if (reviewerOpening) {
    const qMap = reviewerOpening.questions;

    // Answers for VortexGD
    const vortexAnswers: Record<string, unknown> = {};
    vortexAnswers[qMap[0].id] =
      "I have been active in the Nerfed Demonlist community for over a year and regularly check completion proofs. I want to help maintain quick review times and fair verdicts.";
    vortexAnswers[qMap[1].id] = "Very familiar";
    vortexAnswers[qMap[2].id] =
      "I would mark the submission as Needs Changes, politely citing the missing audible click requirement, and provide the player 48 hours to upload unedited raw audio.";
    vortexAnswers[qMap[3].id] =
      "I would recuse myself from the final decision and ask a fellow reviewer or moderator to evaluate it, ensuring zero perceived bias.";
    vortexAnswers[qMap[4].id] = "Yes";
    vortexAnswers[qMap[5].id] = "10–15 hours per week";
    vortexAnswers[qMap[6].id] =
      "I am very patient, familiar with cheat detection indicators (TPS bypass, cut frames), and communicate clearly in Discord.";
    vortexAnswers[qMap[7].id] = "VortexGD#0001";

    const subVortex = await prisma.applicationSubmission.upsert({
      where: {
        openingId_userId: { openingId: reviewerOpening.id, userId: vortex.id },
      },
      update: {
        status: "SHORTLISTED",
        answers: JSON.stringify(vortexAnswers),
        submittedAt: new Date(Date.now() - 3 * 3600 * 1000),
      },
      create: {
        openingId: reviewerOpening.id,
        userId: vortex.id,
        status: "SHORTLISTED",
        answers: JSON.stringify(vortexAnswers),
        submittedAt: new Date(Date.now() - 3 * 3600 * 1000),
      },
    });

    await prisma.applicationNote.deleteMany({ where: { submissionId: subVortex.id } });
    await prisma.applicationNote.create({
      data: {
        submissionId: subVortex.id,
        authorId: admin.id,
        content: "Strong candidate: consistent verifier, knowledgeable with click patterns and cut detection.",
      },
    });

    // Answers for Solaris_GD
    const solarisAnswers: Record<string, unknown> = {};
    solarisAnswers[qMap[0].id] =
      "I've followed the list since v1.0 and beat multiple nerfed extremes. I have a sharp eye for frame consistency and want to help the moderation team stay efficient.";
    solarisAnswers[qMap[1].id] = "Very familiar";
    solarisAnswers[qMap[2].id] =
      "Ask the submitter for full uncut footage including the death attempts before the completion, following standard list verification procedures.";
    solarisAnswers[qMap[3].id] =
      "Immediately declare the conflict of interest in the staff channel and hand the record to another reviewer.";
    solarisAnswers[qMap[4].id] = "Yes";
    solarisAnswers[qMap[5].id] = "8–12 hours per week";
    solarisAnswers[qMap[6].id] =
      "Proficient with Geode mods, video frame inspection, and active during European/US peak hours.";
    solarisAnswers[qMap[7].id] = "SolarisGD";

    await prisma.applicationSubmission.upsert({
      where: {
        openingId_userId: { openingId: reviewerOpening.id, userId: solaris.id },
      },
      update: {
        status: "SUBMITTED",
        answers: JSON.stringify(solarisAnswers),
        submittedAt: new Date(Date.now() - 5 * 3600 * 1000),
      },
      create: {
        openingId: reviewerOpening.id,
        userId: solaris.id,
        status: "SUBMITTED",
        answers: JSON.stringify(solarisAnswers),
        submittedAt: new Date(Date.now() - 5 * 3600 * 1000),
      },
    });

    // Answers for AeroGD (Submitted status)
    const aeroAnswers: Record<string, unknown> = {};
    aeroAnswers[qMap[0].id] =
      "I've followed the list for a while and I'd like to help keep reviews fair and consistent.";
    aeroAnswers[qMap[1].id] = "Very familiar";
    aeroAnswers[qMap[2].id] = "Request raw recorded footage with list-compliant audio clicks.";
    aeroAnswers[qMap[3].id] = "Defer to another reviewer to avoid any conflict of interest.";
    aeroAnswers[qMap[4].id] = "Yes";
    aeroAnswers[qMap[5].id] = "15 hours per week";
    aeroAnswers[qMap[6].id] = "Active daily on Discord with quick response times.";
    aeroAnswers[qMap[7].id] = "AeroGD#1234";

    await prisma.applicationSubmission.upsert({
      where: {
        openingId_userId: { openingId: reviewerOpening.id, userId: aero.id },
      },
      update: {
        status: "SUBMITTED",
        answers: JSON.stringify(aeroAnswers),
        submittedAt: new Date(Date.now() - 2 * 3600 * 1000),
      },
      create: {
        openingId: reviewerOpening.id,
        userId: aero.id,
        status: "SUBMITTED",
        answers: JSON.stringify(aeroAnswers),
        submittedAt: new Date(Date.now() - 2 * 3600 * 1000),
      },
    });

    // Answers for NexusGD (Draft status for typing and autosave)
    const nexusAnswers: Record<string, unknown> = {};
    nexusAnswers[qMap[0].id] =
      "I've followed the list for a while and I'd like to help keep reviews fair and consistent.";

    await prisma.applicationSubmission.upsert({
      where: {
        openingId_userId: { openingId: reviewerOpening.id, userId: nexus.id },
      },
      update: {
        status: "DRAFT",
        answers: JSON.stringify(nexusAnswers),
        submittedAt: null,
      },
      create: {
        openingId: reviewerOpening.id,
        userId: nexus.id,
        status: "DRAFT",
        answers: JSON.stringify(nexusAnswers),
        submittedAt: null,
      },
    });

    // Answers for NovaGD (Shortlisted status, for Accept & Grant Role test)
    const novaAnswers: Record<string, unknown> = {};
    novaAnswers[qMap[0].id] =
      "Long-time demonlist analyst with experience verifying high-end extremes and reviewing click patterns.";
    novaAnswers[qMap[1].id] = "Very familiar";
    novaAnswers[qMap[2].id] =
      "Request uncut audio logs and raw video file before proceeding.";
    novaAnswers[qMap[3].id] = "Recuse myself immediately.";
    novaAnswers[qMap[4].id] = "Yes";
    novaAnswers[qMap[5].id] = "12 hours per week";
    novaAnswers[qMap[6].id] = "Analytical and consistent.";
    novaAnswers[qMap[7].id] = "NovaGD#5678";

    await prisma.applicationSubmission.upsert({
      where: {
        openingId_userId: { openingId: reviewerOpening.id, userId: nova.id },
      },
      update: {
        status: "SHORTLISTED",
        answers: JSON.stringify(novaAnswers),
        submittedAt: new Date(Date.now() - 4 * 3600 * 1000),
      },
      create: {
        openingId: reviewerOpening.id,
        userId: nova.id,
        status: "SHORTLISTED",
        answers: JSON.stringify(novaAnswers),
        submittedAt: new Date(Date.now() - 4 * 3600 * 1000),
      },
    });

    console.log("✓ Submissions seeded for List Reviewer");
  }

  // Beta Feedback
  await prisma.betaFeedback.deleteMany({});
  await prisma.betaFeedback.createMany({
    data: [
      {
        userId: admin.id,
        type: "BUG",
        status: "REVIEWING",
        title: "Mobile leaderboard horizontal scroll hitching on Safari iOS",
        description:
          "When swiping past rank 25 on iPhone 15, the header stickiness causes a small 1px jitter before snapping smoothly.",
        pageUrl: "/levels",
      },
      {
        userId: admin.id,
        type: "SUGGESTION",
        status: "FIXED",
        title: "Pointercrate-inspired large thumbnail view toggle",
        description:
          "Card thumbnails now render crisp 16:9 responsive images with instant hover preview and AVIF delivery.",
        pageUrl: "/",
      },
      {
        userId: admin.id,
        type: "PERFORMANCE",
        status: "NEW",
        title: "Keyboard navigation shortcuts for pending staff review queue",
        description:
          "Pressing 'J' or 'K' in the staff review queue to jump directly between candidate applications.",
        pageUrl: "/admin/applications",
      },
    ],
  });

  console.log("✓ Beta feedback seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
