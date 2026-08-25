import { NextResponse } from 'next/server';
import { syncAllLinkedDiscordUsers } from '@/lib/discord-role-sync';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await syncAllLinkedDiscordUsers();
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { status: 'error', error: message },
      { status: 500 }
    );
  }
}
