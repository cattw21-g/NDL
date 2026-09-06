import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { requireDatabaseUrl } from '../src/lib/production-env';
import { fetchGdLevelMetadata } from '../src/lib/gd-api';

const connectionString = requireDatabaseUrl(process.env, 'sync gd metadata');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const levels = await prisma.level.findMany({
    select: { id: true, name: true, gdLevelId: true }
  });

  console.log(`Found ${levels.length} levels to check/sync.`);

  for (const level of levels) {
    if (!level.gdLevelId) continue;
    console.log(`Fetching GD data for "${level.name}" (ID: ${level.gdLevelId})...`);
    const data = await fetchGdLevelMetadata(level.gdLevelId);
    if (!data) {
      console.log(`  -> Could not fetch data for ${level.gdLevelId}`);
      continue;
    }

    const songLink = data.songId && /^\d+$/.test(data.songId)
      ? `https://www.newgrounds.com/audio/listen/${data.songId}`
      : null;

    await prisma.level.update({
      where: { id: level.id },
      data: {
        songName: data.songName,
        songArtist: data.songArtist,
        songId: data.songId,
        songLink: songLink,
        levelLength: data.length,
        objectCount: data.objects,
        gameVersion: data.gameVersion,
        inGameDifficulty: data.difficulty,
        copyPassword: data.copyPassword,
      }
    });

    console.log(`  -> Updated: "${data.name}", Song: "${data.songName}" by ${data.songArtist} (ID: ${data.songId}), Rating: ${data.difficulty}, Objects: ${data.objects}`);
  }

  console.log('GD metadata sync complete!');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
