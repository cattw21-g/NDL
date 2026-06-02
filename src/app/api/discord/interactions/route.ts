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
  const isVerified = verifyDiscordRequestSignature({
    body,
    signature,
    timestamp,
    publicKey: process.env.DISCORD_PUBLIC_KEY,
  });

  if (!isVerified) {
    return new Response("invalid request signature", { status: 401 });
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
