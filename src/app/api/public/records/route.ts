import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publicRecordWhere } from "@/lib/demo-visibility";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const levelId = searchParams.get("levelId");
  const playerId = searchParams.get("playerId");
  const isVerifier = searchParams.get("isVerifier");
  const minProgress = Number(searchParams.get("minProgress") ?? "0");
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? "50"), 1), 100);
  const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);
  const skip = (page - 1) * limit;

  const where: any = publicRecordWhere({
    ...(levelId ? { levelId } : {}),
    ...(playerId ? { playerId } : {}),
    ...(isVerifier !== null && isVerifier !== undefined
      ? { isVerifier: isVerifier === "true" }
      : {}),
    ...(minProgress > 0 ? { progress: { gte: minProgress } } : {}),
  });

  const [records, totalCount] = await Promise.all([
    prisma.record.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ acceptedAt: "desc" }],
      select: {
        id: true,
        progress: true,
        pointsAwarded: true,
        videoUrl: true,
        fps: true,
        cbfUsed: true,
        isVerifier: true,
        acceptedAt: true,
        level: {
          select: {
            id: true,
            name: true,
            slug: true,
            rank: true,
            status: true,
          },
        },
        player: {
          select: {
            id: true,
            playerName: true,
            displayName: true,
            countryCode: true,
            subdivision: true,
          },
        },
      },
    }),
    prisma.record.count({ where }),
  ]);

  return NextResponse.json({
    data: records,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const apiKeyHeader = request.headers.get("x-api-key");
    const token = authHeader?.replace(/^Bearer\s+/i, "") || apiKeyHeader;

    let authenticatedUser: any = null;

    if (token) {
      // 1. Session token authentication
      const { hashSessionToken } = await import("@/lib/auth");
      const tokenHash = hashSessionToken(token);
      const session = await prisma.session.findUnique({
        where: { tokenHash },
        include: { user: true },
      });
      if (session && session.expiresAt > new Date()) {
        authenticatedUser = session.user;
      }
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON body provided." },
        { status: 400 },
      );
    }

    const {
      levelId,
      levelSlug,
      playerName,
      progress = 100,
      videoUrl,
      rawFootageUrl,
      fps = 360,
      cbfUsed = false,
      clickAudioIncluded = true,
      notes,
    } = body;

    // Validate level
    const level = await prisma.level.findFirst({
      where: {
        OR: [
          ...(levelId ? [{ id: levelId }] : []),
          ...(levelSlug ? [{ slug: levelSlug }] : []),
        ],
      },
    });

    if (!level) {
      return NextResponse.json(
        { error: "Level not found. Provide a valid levelId or levelSlug." },
        { status: 404 },
      );
    }

    if (level.status !== "RANKED" && level.status !== "LEGACY") {
      return NextResponse.json(
        { error: "This level is not currently open for public records." },
        { status: 400 },
      );
    }

    // Validate video URL
    if (!videoUrl || typeof videoUrl !== "string") {
      return NextResponse.json(
        { error: "A valid videoUrl is required." },
        { status: 400 },
      );
    }

    const { normalizeVideoUrl } = await import("@/lib/video-validation");
    const normalized = normalizeVideoUrl(videoUrl);
    if (!normalized.isValid) {
      return NextResponse.json(
        { error: `Invalid video URL: ${normalized.error || "Malformed link."}` },
        { status: 400 },
      );
    }

    // Determine target player
    let effectivePlayer: any;
    if (authenticatedUser) {
      effectivePlayer = authenticatedUser;
    } else {
      const cleanName = (playerName || "").trim();
      if (!cleanName || cleanName.length < 2) {
        return NextResponse.json(
          { error: "Authentication or a valid playerName (min 2 chars) is required." },
          { status: 400 },
        );
      }

      const existingPlayer = await prisma.user.findFirst({
        where: {
          OR: [
            { playerName: { equals: cleanName, mode: "insensitive" } },
            { displayName: { equals: cleanName, mode: "insensitive" } },
          ],
        },
      });

      if (existingPlayer) {
        if (existingPlayer.isSubmissionLocked) {
          return NextResponse.json(
            {
              error: `Submissions for player '${existingPlayer.displayName}' are locked by the claimed account owner. Authentication required.`,
            },
            { status: 403 },
          );
        }
        effectivePlayer = existingPlayer;
      } else {
        const cleanHandle =
          cleanName.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30) ||
          `player_${Date.now()}`;
        let uniqueHandle = cleanHandle;
        let counter = 1;
        while (await prisma.user.findUnique({ where: { playerName: uniqueHandle } })) {
          uniqueHandle = `${cleanHandle}_${counter++}`;
        }

        effectivePlayer = await prisma.user.create({
          data: {
            email: `${uniqueHandle}_api@nerfeddemonlist.local`,
            passwordHash: "UNCLAIMED_GUEST_ACCOUNT",
            playerName: uniqueHandle,
            displayName: cleanName,
            role: "PLAYER",
          },
        });
      }
    }

    // Check duplicate video
    const existingVideo = await prisma.recordSubmission.findFirst({
      where: {
        videoUrl: { equals: normalized.normalizedUrl, mode: "insensitive" },
        status: { in: ["PENDING", "UNDER_CONSIDERATION"] },
      },
    });

    if (existingVideo) {
      return NextResponse.json(
        { error: "This video proof link has already been submitted and is currently in review." },
        { status: 409 },
      );
    }

    const { buildSubmissionCreateData } = await import("@/lib/submission-workflow");
    const { ModerationActionType } = await import("@/generated/prisma/enums");

    const submissionData = buildSubmissionCreateData(effectivePlayer.id, {
      levelId: level.id,
      progress: Math.min(100, Math.max(1, Number(progress) || 100)),
      videoUrl: normalized.normalizedUrl,
      rawFootageUrl: rawFootageUrl || undefined,
      proofImageUrl: undefined,
      fps: Number(fps) || 360,
      cbfUsed: Boolean(cbfUsed),
      clickAudioIncluded: Boolean(clickAudioIncluded),
      separateMicClickTrack: false,
      gameAudioIncluded: true,
      rawFootageIncluded: Boolean(rawFootageUrl),
      fpsOverlayVisible: true,
      cpsCounterVisible: true,
      cheatIndicatorVisible: false,
      inputDevice: "API Submission",
      proofNotes: notes || "Submitted via Nerfed Demonlist Public Write API",
      comments: `External Write API (Auth: ${authenticatedUser ? "UserToken" : "Guest"})`,
    });

    const submission = await prisma.recordSubmission.create({
      data: submissionData,
    });

    await prisma.moderationAction.create({
      data: {
        actorId: effectivePlayer.id,
        type: ModerationActionType.SUBMISSION_CREATED,
        targetType: "RecordSubmission",
        targetId: submission.id,
        summary: `API: ${effectivePlayer.displayName} submitted a record for ${level.name}.`,
      },
    });

    const { notifyNewSubmission } = await import("@/lib/discord-notify");
    notifyNewSubmission({
      playerName: effectivePlayer.displayName,
      playerHandle: effectivePlayer.playerName,
      levelName: level.name,
      levelSlug: level.slug,
      levelRank: level.rank,
      progress: submissionData.progress,
      videoUrl: submissionData.videoUrl,
    }).catch(() => null);

    return NextResponse.json(
      {
        success: true,
        submissionId: submission.id,
        status: submission.status,
        player: {
          id: effectivePlayer.id,
          playerName: effectivePlayer.playerName,
          displayName: effectivePlayer.displayName,
        },
        level: {
          id: level.id,
          name: level.name,
          slug: level.slug,
        },
        message: "Record submission queued for moderator review.",
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Write API error:", error);
    return NextResponse.json(
      { error: "Internal server error processing record submission." },
      { status: 500 },
    );
  }
}

