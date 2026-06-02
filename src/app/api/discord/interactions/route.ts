import { NextResponse } from "next/server";

import {
  handleDiscordInteraction,
  verifyDiscordRequestSignature,
  type DiscordInteraction,
} from "@/lib/discord-interactions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("X-Signature-Ed25519");
  const timestamp = request.headers.get("X-Signature-Timestamp");
  const publicKey = process.env.DISCORD_PUBLIC_KEY?.trim();

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

  if (!isVerified) {
    return invalidSignatureResponse();
  }

  let interaction: DiscordInteraction;

  try {
    interaction = JSON.parse(body) as DiscordInteraction;
  } catch {
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
