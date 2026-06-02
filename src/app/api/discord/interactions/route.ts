import { NextResponse } from "next/server";

import {
  handleDiscordInteraction,
  verifyDiscordRequestSignature,
  type DiscordInteraction,
} from "@/lib/discord-interactions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return discordInteractionsHealthResponse();
}

export async function POST(request: Request) {
  logDiscordInteraction("route hit");
  const body = await request.text();
  const signature = request.headers.get("X-Signature-Ed25519");
  const timestamp = request.headers.get("X-Signature-Timestamp");
  const publicKey = process.env.DISCORD_PUBLIC_KEY?.trim();

  logDiscordInteraction("request diagnostics", {
    hasSignature: Boolean(signature),
    hasTimestamp: Boolean(timestamp),
    hasPublicKey: Boolean(publicKey),
    bodyLength: body.length,
  });

  if (!publicKey) {
    console.error(
      "DISCORD_PUBLIC_KEY is required to verify Discord interactions.",
    );

    return invalidSignatureResponse();
  }

  const isVerified = verifyDiscordRequestSignature({
    body,
    signature,
    timestamp,
    publicKey,
  });

  logDiscordInteraction("signature verification", {
    verified: isVerified,
  });

  if (!isVerified) {
    return invalidSignatureResponse();
  }

  let interaction: DiscordInteraction;

  try {
    interaction = JSON.parse(body) as DiscordInteraction;
    logDiscordInteraction("json parsed", {
      parsed: true,
      payloadType: interaction.type ?? null,
      isPing: interaction.type === 1,
    });
  } catch {
    logDiscordInteraction("json parsed", {
      parsed: false,
    });

    return NextResponse.json(
      {
        type: 4,
        data: {
          content: "Invalid Discord interaction payload.",
          flags: 64,
          allowed_mentions: { parse: [] },
        },
      },
      { status: 400 },
    );
  }

  if (interaction.type === 1) {
    logDiscordInteraction("PING received");
    logDiscordInteraction("PING returning PONG");

    return NextResponse.json({ type: 1 });
  }

  return NextResponse.json(await handleDiscordInteraction(interaction));
}

function invalidSignatureResponse() {
  return NextResponse.json(
    {
      error: "invalid request signature",
    },
    { status: 401 },
  );
}

export function discordInteractionsHealthResponse() {
  return NextResponse.json({
    ok: true,
    route: "/api/discord/interactions",
    hasPublicKey: Boolean(process.env.DISCORD_PUBLIC_KEY?.trim()),
    timestamp: new Date().toISOString(),
  });
}

function logDiscordInteraction(
  event: string,
  details?: Record<string, boolean | number | string | null>,
) {
  console.log("[discord-interactions]", event, details ?? {});
}
