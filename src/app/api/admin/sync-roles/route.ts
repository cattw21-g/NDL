import { NextResponse } from 'next/server';
import { syncAllLinkedDiscordUsers } from '@/lib/discord-role-sync';
import { requireApiAdmin } from '@/lib/api-admin-guard';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireApiAdmin(request);
  if (!auth.authorized) {
    return auth.response;
  }

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
