process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://ndl:ndl_dev_password@localhost:5432/ndl?schema=public";
process.env.SESSION_SECRET = process.env.SESSION_SECRET || "mock-session-secret-at-least-32-chars-long";

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  prisma: {},
}));
vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

import { PrismaClient } from "@/generated/prisma/client";
import { executeApplicationDecision } from "@/actions/applications";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import type { Role } from "@/generated/prisma/enums";

const connectionString = "postgresql://ndl:ndl_dev_password@localhost:5432/ndl?schema=public";

describe("Real PostgreSQL Database Concurrency & Race Condition Verification", () => {
  let pool: Pool;
  let adapter: PrismaPg;
  let prisma: PrismaClient;
  let isDbAvailable = false;
  let adminDbUser: { id: string; displayName: string; role: Role; playerName: string };

  beforeAll(async () => {
    try {
      pool = new Pool({ connectionString, max: 20 });
      adapter = new PrismaPg(pool);
      prisma = new PrismaClient({ adapter });
      await prisma.$queryRaw`SELECT 1`;
      isDbAvailable = true;

      adminDbUser = await prisma.user.upsert({
        where: { id: "admin-root-test" },
        update: {},
        create: {
          id: "admin-root-test",
          email: "admin-test@ndl.test",
          passwordHash: "hash",
          displayName: "Root Admin Test",
          playerName: "cattw21",
          role: "ADMIN",
        },
      });
    } catch (e) {
      console.warn("Local PostgreSQL not available, skipping live concurrency tests:", (e as Error).message);
      isDbAvailable = false;
    }
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    if (pool) {
      await pool.end();
    }
  });

  it("proves positions = 1 with 2 concurrent accepts results in EXACTLY 1 accepted", async () => {
    if (!isDbAvailable) return;

    // 1. Setup Opening with maxPositions = 1
    const opening = await prisma.applicationOpening.create({
      data: {
        title: "Top Concurrency Opening",
        slug: `conc-1-${Date.now()}`,
        role: "LIST_REVIEWER",
        description: "Testing position race",
        status: "OPEN",
        maxPositions: 1,
        createdById: adminDbUser.id,
      },
    });

    const user1 = await prisma.user.create({
      data: {
        email: `u1-${Date.now()}@ndl.test`,
        passwordHash: "hash",
        displayName: "User 1",
        playerName: `P1_${Date.now()}`,
        role: "PLAYER",
      },
    });

    const user2 = await prisma.user.create({
      data: {
        email: `u2-${Date.now()}@ndl.test`,
        passwordHash: "hash",
        displayName: "User 2",
        playerName: `P2_${Date.now()}`,
        role: "PLAYER",
      },
    });

    const sub1 = await prisma.applicationSubmission.create({
      data: {
        openingId: opening.id,
        userId: user1.id,
        status: "SUBMITTED",
        answers: "{}",
        questionSnapshot: "[]",
      },
    });

    const sub2 = await prisma.applicationSubmission.create({
      data: {
        openingId: opening.id,
        userId: user2.id,
        status: "SUBMITTED",
        answers: "{}",
        questionSnapshot: "[]",
      },
    });

    const admin = {
      id: adminDbUser.id,
      displayName: adminDbUser.displayName,
      role: "ADMIN" as const,
      playerName: adminDbUser.playerName,
    };

    // Run 2 truly concurrent accepts against the PostgreSQL database
    const results = await Promise.allSettled([
      prisma.$transaction(async (tx) => {
        return executeApplicationDecision(tx, {
          submissionId: sub1.id,
          decision: "ACCEPTED",
          adminUser: admin,
        });
      }),
      prisma.$transaction(async (tx) => {
        return executeApplicationDecision(tx, {
          submissionId: sub2.id,
          decision: "ACCEPTED",
          adminUser: admin,
        });
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const rejectionReason = (rejected[0] as PromiseRejectedResult).reason;
    expect(rejectionReason.message).toContain("Position limit reached (1/1 accepted)");

    // Database verification: exactly 1 ACCEPTED row in PostgreSQL
    const acceptedCountInDb = await prisma.applicationSubmission.count({
      where: { openingId: opening.id, status: "ACCEPTED" },
    });
    expect(acceptedCountInDb).toBe(1);

    // Verify role granted to exactly one user
    const dbUser1 = await prisma.user.findUnique({ where: { id: user1.id } });
    const dbUser2 = await prisma.user.findUnique({ where: { id: user2.id } });
    const grantedRoles = [dbUser1?.role, dbUser2?.role].filter((r) => r === "LIST_REVIEWER");
    expect(grantedRoles).toHaveLength(1);
  });

  it("proves positions = 2 with 10 concurrent accepts results in EXACTLY 2 accepted", async () => {
    if (!isDbAvailable) return;

    const opening = await prisma.applicationOpening.create({
      data: {
        title: "Capacity 2 Opening",
        slug: `conc-2-${Date.now()}`,
        role: "LIST_MODERATOR",
        description: "Testing capacity 2",
        status: "OPEN",
        maxPositions: 2,
        createdById: adminDbUser.id,
      },
    });

    const admin = {
      id: adminDbUser.id,
      displayName: adminDbUser.displayName,
      role: "ADMIN" as const,
      playerName: adminDbUser.playerName,
    };

    // Create 10 applicants
    const submissions = [];
    for (let i = 0; i < 10; i++) {
      const user = await prisma.user.create({
        data: {
          email: `u-10-${i}-${Date.now()}@ndl.test`,
          passwordHash: "hash",
          displayName: `Candidate ${i}`,
          playerName: `Cand_${i}_${Date.now()}`,
          role: "PLAYER",
        },
      });

      const sub = await prisma.applicationSubmission.create({
        data: {
          openingId: opening.id,
          userId: user.id,
          status: "SUBMITTED",
          answers: "{}",
          questionSnapshot: "[]",
        },
      });
      submissions.push(sub);
    }

    // Launch all 10 accept transactions simultaneously
    const results = await Promise.allSettled(
      submissions.map((sub) =>
        prisma.$transaction(async (tx) => {
          return executeApplicationDecision(tx, {
            submissionId: sub.id,
            decision: "ACCEPTED",
            adminUser: admin,
          });
        }),
      ),
    );

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(2);
    expect(rejected).toHaveLength(8);

    const inDb = await prisma.applicationSubmission.count({
      where: { openingId: opening.id, status: "ACCEPTED" },
    });
    expect(inDb).toBe(2);
  });

  it("proves positions = null (unlimited) with 10 concurrent accepts allows all 10", async () => {
    if (!isDbAvailable) return;

    const opening = await prisma.applicationOpening.create({
      data: {
        title: "Unlimited Opening",
        slug: `conc-unlim-${Date.now()}`,
        role: "BETA_TESTER",
        description: "Testing unlimited",
        status: "OPEN",
        maxPositions: null, // Unlimited
        createdById: adminDbUser.id,
      },
    });

    const admin = {
      id: adminDbUser.id,
      displayName: adminDbUser.displayName,
      role: "ADMIN" as const,
      playerName: adminDbUser.playerName,
    };

    const submissions = [];
    for (let i = 0; i < 10; i++) {
      const user = await prisma.user.create({
        data: {
          email: `u-unlim-${i}-${Date.now()}@ndl.test`,
          passwordHash: "hash",
          displayName: `Beta ${i}`,
          playerName: `Beta_${i}_${Date.now()}`,
          role: "PLAYER",
        },
      });

      const sub = await prisma.applicationSubmission.create({
        data: {
          openingId: opening.id,
          userId: user.id,
          status: "SUBMITTED",
          answers: "{}",
          questionSnapshot: "[]",
        },
      });
      submissions.push(sub);
    }

    const results = await Promise.allSettled(
      submissions.map((sub) =>
        prisma.$transaction(async (tx) => {
          return executeApplicationDecision(tx, {
            submissionId: sub.id,
            decision: "ACCEPTED",
            adminUser: admin,
          });
        }),
      ),
    );

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    expect(fulfilled).toHaveLength(10);

    const inDb = await prisma.applicationSubmission.count({
      where: { openingId: opening.id, status: "ACCEPTED" },
    });
    expect(inDb).toBe(10);
  });

  it("proves two separate openings running concurrently do not block each other", async () => {
    if (!isDbAvailable) return;

    const openingA = await prisma.applicationOpening.create({
      data: {
        title: "Opening A",
        slug: `op-a-${Date.now()}`,
        role: "LIST_REVIEWER",
        description: "A",
        status: "OPEN",
        maxPositions: 1,
        createdById: adminDbUser.id,
      },
    });

    const openingB = await prisma.applicationOpening.create({
      data: {
        title: "Opening B",
        slug: `op-b-${Date.now()}`,
        role: "LIST_MODERATOR",
        description: "B",
        status: "OPEN",
        maxPositions: 1,
        createdById: adminDbUser.id,
      },
    });

    const userA = await prisma.user.create({
      data: {
        email: `ua-${Date.now()}@ndl.test`,
        passwordHash: "hash",
        displayName: "User A",
        playerName: `PA_${Date.now()}`,
        role: "PLAYER",
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: `ub-${Date.now()}@ndl.test`,
        passwordHash: "hash",
        displayName: "User B",
        playerName: `PB_${Date.now()}`,
        role: "PLAYER",
      },
    });

    const subA = await prisma.applicationSubmission.create({
      data: {
        openingId: openingA.id,
        userId: userA.id,
        status: "SUBMITTED",
        answers: "{}",
        questionSnapshot: "[]",
      },
    });

    const subB = await prisma.applicationSubmission.create({
      data: {
        openingId: openingB.id,
        userId: userB.id,
        status: "SUBMITTED",
        answers: "{}",
        questionSnapshot: "[]",
      },
    });

    const admin = {
      id: adminDbUser.id,
      displayName: adminDbUser.displayName,
      role: "ADMIN" as const,
      playerName: adminDbUser.playerName,
    };

    const results = await Promise.allSettled([
      prisma.$transaction(async (tx) => {
        return executeApplicationDecision(tx, {
          submissionId: subA.id,
          decision: "ACCEPTED",
          adminUser: admin,
        });
      }),
      prisma.$transaction(async (tx) => {
        return executeApplicationDecision(tx, {
          submissionId: subB.id,
          decision: "ACCEPTED",
          adminUser: admin,
        });
      }),
    ]);

    expect(results[0].status).toBe("fulfilled");
    expect(results[1].status).toBe("fulfilled");
  });

  it("proves Accept vs Reject race on single application produces EXACTLY ONE winner", async () => {
    if (!isDbAvailable) return;

    const opening = await prisma.applicationOpening.create({
      data: {
        title: "Race Opening",
        slug: `race-ar-${Date.now()}`,
        role: "LIST_REVIEWER",
        description: "Race test",
        status: "OPEN",
        maxPositions: 5,
        createdById: adminDbUser.id,
      },
    });

    const user = await prisma.user.create({
      data: {
        email: `u-race-${Date.now()}@ndl.test`,
        passwordHash: "hash",
        displayName: "Candidate Race",
        playerName: `CandRace_${Date.now()}`,
        role: "PLAYER",
      },
    });

    const sub = await prisma.applicationSubmission.create({
      data: {
        openingId: opening.id,
        userId: user.id,
        status: "SUBMITTED",
        answers: "{}",
        questionSnapshot: "[]",
      },
    });

    const adminA = { id: adminDbUser.id, displayName: "Admin Alpha", role: "ADMIN" as const, playerName: "cattw21" };
    const adminB = { id: adminDbUser.id, displayName: "Admin Beta", role: "ADMIN" as const, playerName: "cattw21" };

    const results = await Promise.allSettled([
      prisma.$transaction(async (tx) => {
        return executeApplicationDecision(tx, {
          submissionId: sub.id,
          decision: "ACCEPTED",
          adminUser: adminA,
        });
      }),
      prisma.$transaction(async (tx) => {
        return executeApplicationDecision(tx, {
          submissionId: sub.id,
          decision: "REJECTED",
          adminUser: adminB,
        });
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const winnerDecision = (
      fulfilled[0] as PromiseFulfilledResult<{ submission: { status: string } }>
    ).value;
    const finalSub = await prisma.applicationSubmission.findUnique({ where: { id: sub.id } });

    expect(finalSub?.status).toBe(winnerDecision.submission.status);
    expect(["ACCEPTED", "REJECTED"]).toContain(finalSub?.status);

    const finalUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (finalSub?.status === "ACCEPTED") {
      expect(finalUser?.role).toBe("LIST_REVIEWER");
    } else {
      expect(finalUser?.role).toBe("PLAYER");
    }
  });

  it("proves Accept vs Withdraw race is deterministic and prevents granting role to withdrawn application", async () => {
    if (!isDbAvailable) return;

    const opening = await prisma.applicationOpening.create({
      data: {
        title: "Withdraw Race Opening",
        slug: `race-aw-${Date.now()}`,
        role: "LIST_REVIEWER",
        description: "Withdraw race",
        status: "OPEN",
        maxPositions: 5,
        createdById: adminDbUser.id,
      },
    });

    const user = await prisma.user.create({
      data: {
        email: `u-withdraw-${Date.now()}@ndl.test`,
        passwordHash: "hash",
        displayName: "Candidate Withdraw",
        playerName: `CandWith_${Date.now()}`,
        role: "PLAYER",
      },
    });

    const sub = await prisma.applicationSubmission.create({
      data: {
        openingId: opening.id,
        userId: user.id,
        status: "SUBMITTED",
        answers: "{}",
        questionSnapshot: "[]",
      },
    });

    const admin = {
      id: adminDbUser.id,
      displayName: adminDbUser.displayName,
      role: "ADMIN" as const,
      playerName: adminDbUser.playerName,
    };

    // Function simulating withdrawal inside transaction with row lock
    const runWithdraw = async () => {
      return prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "ApplicationSubmission" WHERE "id" = ${sub.id} FOR UPDATE`;
        const current = await tx.applicationSubmission.findUnique({ where: { id: sub.id } });
        if (!current) throw new Error("Application not found.");
        if (current.status === "ACCEPTED") throw new Error("Cannot withdraw an accepted application.");
        if (current.status === "WITHDRAWN") return { status: "ALREADY_WITHDRAWN" };
        await tx.applicationSubmission.update({
          where: { id: sub.id },
          data: { status: "WITHDRAWN" },
        });
        return { status: "WITHDRAWN" };
      });
    };

    const runAccept = async () => {
      return prisma.$transaction(async (tx) => {
        return executeApplicationDecision(tx, {
          submissionId: sub.id,
          decision: "ACCEPTED",
          adminUser: admin,
        });
      });
    };

    const results = await Promise.allSettled([runWithdraw(), runAccept()]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const finalSub = await prisma.applicationSubmission.findUnique({ where: { id: sub.id } });
    const finalUser = await prisma.user.findUnique({ where: { id: user.id } });

    if (finalSub?.status === "WITHDRAWN") {
      // Withdrawal won the race: user role must remain PLAYER
      expect(finalUser?.role).toBe("PLAYER");
    } else {
      // Accept won the race: user role is granted LIST_REVIEWER
      expect(finalSub?.status).toBe("ACCEPTED");
      expect(finalUser?.role).toBe("LIST_REVIEWER");
    }
  });
});
