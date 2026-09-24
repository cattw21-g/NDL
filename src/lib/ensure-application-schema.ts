import { prisma } from "@/lib/db";
import { APPLICATION_TEMPLATES } from "@/lib/application-templates";

export interface SchemaEnsureResult {
  migrated: boolean;
  openingsCreated: number;
  openingsUpdated: number;
  error?: string;
}

export async function ensureApplicationSchemaAndOpenings(): Promise<SchemaEnsureResult> {
  let migrated = false;
  let openingsCreated = 0;
  let openingsUpdated = 0;

  try {
    // 1. Check if ApplicationOpening table exists
    const checkTable = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'ApplicationOpening'
      ) as exists;
    `;

    const tableExists = Boolean(checkTable?.[0]?.exists);

    if (!tableExists) {
      // 2. Add enum values individually (PostgreSQL disallows ALTER TYPE ADD VALUE in multi-command transactions)
      const enumAdditions = [
        `ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'LIST_MODERATOR';`,
        `ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'LIST_REVIEWER';`,
        `ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'BETA_TESTER';`,
      ];

      for (const sql of enumAdditions) {
        try {
          await prisma.$executeRawUnsafe(sql);
        } catch (e) {
          console.warn("Enum addition notice:", e);
        }
      }

      // 3. Create enum types
      const createEnums = [
        `DO $$ BEGIN
          CREATE TYPE "ApplicationRole" AS ENUM ('LIST_REVIEWER', 'LIST_MODERATOR', 'BETA_TESTER');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;`,
        `DO $$ BEGIN
          CREATE TYPE "ApplicationOpeningStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;`,
        `DO $$ BEGIN
          CREATE TYPE "ApplicationQuestionType" AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'YES_NO');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;`,
        `DO $$ BEGIN
          CREATE TYPE "ApplicationSubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'WITHDRAWN', 'SHORTLISTED', 'ACCEPTED', 'REJECTED');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;`,
        `DO $$ BEGIN
          CREATE TYPE "BetaFeedbackType" AS ENUM ('BUG', 'UI_UX', 'PERFORMANCE', 'SUGGESTION', 'OTHER');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;`,
        `DO $$ BEGIN
          CREATE TYPE "BetaFeedbackStatus" AS ENUM ('NEW', 'REVIEWING', 'FIXED', 'WONT_FIX');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;`,
      ];

      for (const sql of createEnums) {
        await prisma.$executeRawUnsafe(sql);
      }

      // 4. Create Tables
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ApplicationOpening" (
            "id" TEXT NOT NULL,
            "slug" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "role" "ApplicationRole" NOT NULL,
            "description" TEXT NOT NULL,
            "status" "ApplicationOpeningStatus" NOT NULL DEFAULT 'DRAFT',
            "openAt" TIMESTAMP(3),
            "deadline" TIMESTAMP(3),
            "maxPositions" INTEGER,
            "requirements" TEXT,
            "isPublished" BOOLEAN NOT NULL DEFAULT false,
            "createdById" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "ApplicationOpening_pkey" PRIMARY KEY ("id")
        );

        CREATE TABLE IF NOT EXISTS "ApplicationQuestion" (
            "id" TEXT NOT NULL,
            "openingId" TEXT NOT NULL,
            "order" INTEGER NOT NULL,
            "prompt" TEXT NOT NULL,
            "description" TEXT,
            "type" "ApplicationQuestionType" NOT NULL,
            "required" BOOLEAN NOT NULL DEFAULT true,
            "options" TEXT,
            "placeholder" TEXT,
            "minLength" INTEGER,
            "maxLength" INTEGER,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "ApplicationQuestion_pkey" PRIMARY KEY ("id")
        );

        CREATE TABLE IF NOT EXISTS "ApplicationSubmission" (
            "id" TEXT NOT NULL,
            "openingId" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "status" "ApplicationSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
            "answers" TEXT NOT NULL DEFAULT '{}',
            "questionSnapshot" TEXT,
            "submittedAt" TIMESTAMP(3),
            "decidedAt" TIMESTAMP(3),
            "decidedById" TEXT,
            "decisionNotes" TEXT,
            "rating" INTEGER,
            "rubricScores" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "ApplicationSubmission_pkey" PRIMARY KEY ("id")
        );

        CREATE TABLE IF NOT EXISTS "ApplicationNote" (
            "id" TEXT NOT NULL,
            "submissionId" TEXT NOT NULL,
            "authorId" TEXT NOT NULL,
            "content" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "ApplicationNote_pkey" PRIMARY KEY ("id")
        );

        CREATE TABLE IF NOT EXISTS "UserNotification" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "message" TEXT NOT NULL,
            "link" TEXT,
            "read" BOOLEAN NOT NULL DEFAULT false,
            "type" TEXT NOT NULL DEFAULT 'GENERAL',
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
        );

        CREATE TABLE IF NOT EXISTS "DiscordSyncJob" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "action" TEXT NOT NULL,
            "roleKey" TEXT NOT NULL,
            "payload" TEXT,
            "status" TEXT NOT NULL DEFAULT 'PENDING',
            "attempts" INTEGER NOT NULL DEFAULT 0,
            "maxAttempts" INTEGER NOT NULL DEFAULT 5,
            "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "lastError" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "DiscordSyncJob_pkey" PRIMARY KEY ("id")
        );

        CREATE TABLE IF NOT EXISTS "BetaFeedback" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "type" "BetaFeedbackType" NOT NULL,
            "status" "BetaFeedbackStatus" NOT NULL DEFAULT 'NEW',
            "title" TEXT NOT NULL,
            "description" TEXT NOT NULL,
            "pageUrl" TEXT,
            "browserInfo" TEXT,
            "adminNotes" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "BetaFeedback_pkey" PRIMARY KEY ("id")
        );
      `);

      // 5. Create Indexes
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "ApplicationOpening_slug_key" ON "ApplicationOpening"("slug");
        CREATE INDEX IF NOT EXISTS "ApplicationOpening_slug_idx" ON "ApplicationOpening"("slug");
        CREATE INDEX IF NOT EXISTS "ApplicationOpening_status_idx" ON "ApplicationOpening"("status");
        CREATE INDEX IF NOT EXISTS "ApplicationOpening_role_idx" ON "ApplicationOpening"("role");

        CREATE INDEX IF NOT EXISTS "ApplicationQuestion_openingId_order_idx" ON "ApplicationQuestion"("openingId", "order");

        CREATE UNIQUE INDEX IF NOT EXISTS "ApplicationSubmission_openingId_userId_key" ON "ApplicationSubmission"("openingId", "userId");
        CREATE INDEX IF NOT EXISTS "ApplicationSubmission_openingId_status_idx" ON "ApplicationSubmission"("openingId", "status");
        CREATE INDEX IF NOT EXISTS "ApplicationSubmission_userId_status_idx" ON "ApplicationSubmission"("userId", "status");

        CREATE INDEX IF NOT EXISTS "ApplicationNote_submissionId_createdAt_idx" ON "ApplicationNote"("submissionId", "createdAt");

        CREATE INDEX IF NOT EXISTS "UserNotification_userId_read_createdAt_idx" ON "UserNotification"("userId", "read", "createdAt");

        CREATE INDEX IF NOT EXISTS "DiscordSyncJob_status_nextAttemptAt_idx" ON "DiscordSyncJob"("status", "nextAttemptAt");

        CREATE INDEX IF NOT EXISTS "BetaFeedback_status_createdAt_idx" ON "BetaFeedback"("status", "createdAt");
        CREATE INDEX IF NOT EXISTS "BetaFeedback_userId_createdAt_idx" ON "BetaFeedback"("userId", "createdAt");
      `);

      // 6. Foreign Keys
      const foreignKeys = [
        `DO $$ BEGIN
          ALTER TABLE "ApplicationOpening" ADD CONSTRAINT "ApplicationOpening_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN
          ALTER TABLE "ApplicationQuestion" ADD CONSTRAINT "ApplicationQuestion_openingId_fkey" FOREIGN KEY ("openingId") REFERENCES "ApplicationOpening"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN
          ALTER TABLE "ApplicationSubmission" ADD CONSTRAINT "ApplicationSubmission_openingId_fkey" FOREIGN KEY ("openingId") REFERENCES "ApplicationOpening"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN
          ALTER TABLE "ApplicationSubmission" ADD CONSTRAINT "ApplicationSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN
          ALTER TABLE "ApplicationSubmission" ADD CONSTRAINT "ApplicationSubmission_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN
          ALTER TABLE "ApplicationNote" ADD CONSTRAINT "ApplicationNote_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ApplicationSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN
          ALTER TABLE "ApplicationNote" ADD CONSTRAINT "ApplicationNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN
          ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null; END $$;`,
        `DO $$ BEGIN
          ALTER TABLE "BetaFeedback" ADD CONSTRAINT "BetaFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      ];

      for (const fk of foreignKeys) {
        try {
          await prisma.$executeRawUnsafe(fk);
        } catch (e) {
          console.warn("FK constraint notice:", e);
        }
      }

      // 7. Register migration in _prisma_migrations so Prisma CLI recognizes it
      try {
        await prisma.$executeRawUnsafe(`
          INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
          SELECT gen_random_uuid()::text, 'b558299e075099eb46264a59b8de2cbde0b145fe76b04c26af4301e0193c5a91', now(), '20260923230000_staff_applications_and_roles', null, null, now(), 1
          WHERE EXISTS (
            SELECT 1 FROM information_schema.tables WHERE table_name = '_prisma_migrations'
          ) AND NOT EXISTS (
            SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20260923230000_staff_applications_and_roles'
          );
        `);
      } catch (e) {
        console.warn("Notice updating _prisma_migrations:", e);
      }

      migrated = true;
    }

    // 8. Ensure Openings and Questions are populated and OPEN
    const adminUser =
      (await prisma.user.findFirst({
        where: { role: "ADMIN" },
        orderBy: { createdAt: "asc" },
      })) ||
      (await prisma.user.findFirst({
        orderBy: { createdAt: "asc" },
      }));

    if (!adminUser) {
      return { migrated, openingsCreated, openingsUpdated, error: "No user found in database to assign as opening author" };
    }

    for (const tmpl of Object.values(APPLICATION_TEMPLATES)) {
      const existing = await prisma.applicationOpening.findUnique({
        where: { slug: tmpl.slug },
      });

      let openingId: string;

      if (!existing) {
        const created = await prisma.applicationOpening.create({
          data: {
            slug: tmpl.slug,
            title: tmpl.title,
            role: tmpl.role,
            description: tmpl.description,
            requirements: JSON.stringify(tmpl.requirements),
            status: "OPEN",
            isPublished: true,
            maxPositions: tmpl.defaultMaxPositions ?? 5,
            createdById: adminUser.id,
          },
        });
        openingId = created.id;
        openingsCreated++;
      } else {
        await prisma.applicationOpening.update({
          where: { id: existing.id },
          data: {
            title: tmpl.title,
            role: tmpl.role,
            description: tmpl.description,
            requirements: JSON.stringify(tmpl.requirements),
            status: "OPEN",
            isPublished: true,
            maxPositions: tmpl.defaultMaxPositions ?? 5,
          },
        });
        openingId = existing.id;
        openingsUpdated++;
      }

      // Check questions count
      const questionCount = await prisma.applicationQuestion.count({
        where: { openingId },
      });

      if (questionCount === 0) {
        for (const q of tmpl.questions) {
          await prisma.applicationQuestion.create({
            data: {
              openingId,
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
      }
    }

    return {
      migrated,
      openingsCreated,
      openingsUpdated,
    };
  } catch (err) {
    console.error("ensureApplicationSchemaAndOpenings failed:", err);
    return {
      migrated,
      openingsCreated,
      openingsUpdated,
      error: String(err),
    };
  }
}
