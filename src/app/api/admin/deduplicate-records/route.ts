import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { syncAllLinkedDiscordUsers } from '@/lib/discord-role-sync';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allRecords = await prisma.record.findMany({
      include: {
        player: {
          select: {
            id: true,
            displayName: true,
            playerName: true,
          },
        },
        level: {
          select: {
            id: true,
            name: true,
            slug: true,
            rank: true,
          },
        },
      },
      orderBy: [
        { progress: 'desc' },
        { acceptedAt: 'desc' },
      ],
    });

    const groups = new Map<string, typeof allRecords>();
    for (const r of allRecords) {
      const key = `${r.playerId}::${r.levelId}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(r);
    }

    const removedRecords: Array<{
      id: string;
      player: string;
      level: string;
      progress: number;
      acceptedAt: string;
    }> = [];

    const keptRecords: Array<{
      id: string;
      player: string;
      level: string;
      progress: number;
    }> = [];

    for (const [, list] of groups.entries()) {
      if (list.length > 1) {
        // First one is the highest progress (and latest accepted)
        const best = list[0];
        keptRecords.push({
          id: best.id,
          player: best.player.displayName,
          level: best.level.name,
          progress: best.progress,
        });

        // The remaining are lower/duplicate records to delete
        const toDelete = list.slice(1);
        for (const item of toDelete) {
          await prisma.record.delete({
            where: { id: item.id },
          });
          removedRecords.push({
            id: item.id,
            player: item.player.displayName,
            level: item.level.name,
            progress: item.progress,
            acceptedAt: item.acceptedAt.toISOString(),
          });
        }
      }
    }

    if (removedRecords.length > 0) {
      revalidatePath('/');
      revalidatePath('/players');
      revalidatePath('/admin/records');
      for (const k of keptRecords) {
        revalidatePath(`/players/${k.player}`);
      }
      await syncAllLinkedDiscordUsers().catch(() => {});
    }

    return NextResponse.json({
      status: 'ok',
      totalRecordsChecked: allRecords.length,
      duplicateSetsFound: keptRecords.length,
      recordsRemoved: removedRecords.length,
      removedRecords,
      keptRecords,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { status: 'error', error: message },
      { status: 500 },
    );
  }
}
