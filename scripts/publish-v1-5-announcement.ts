import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { requireDatabaseUrl } from '../src/lib/production-env';
import { V1_5_ANNOUNCEMENT_POST } from '../src/lib/changelog';

const connectionString = requireDatabaseUrl(process.env, 'publish v1.5 announcement');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, displayName: true }
  });

  // Unpin all posts
  await prisma.changelogPost.updateMany({
    where: { isPinned: true },
    data: { isPinned: false },
  });

  // Clean up old slug if present
  try {
    await prisma.changelogPost.deleteMany({
      where: { slug: 'nerfed-demonlist-v2-0-0-official-roadmap' },
    });
  } catch {}

  const post = await prisma.changelogPost.upsert({
    where: { slug: V1_5_ANNOUNCEMENT_POST.slug },
    create: {
      title: V1_5_ANNOUNCEMENT_POST.title,
      slug: V1_5_ANNOUNCEMENT_POST.slug,
      category: V1_5_ANNOUNCEMENT_POST.category,
      summary: V1_5_ANNOUNCEMENT_POST.summary,
      content: V1_5_ANNOUNCEMENT_POST.content,
      isPublished: true,
      isPinned: true,
      publishedAt: new Date(),
      authorId: adminUser?.id ?? null,
    },
    update: {
      title: V1_5_ANNOUNCEMENT_POST.title,
      category: V1_5_ANNOUNCEMENT_POST.category,
      summary: V1_5_ANNOUNCEMENT_POST.summary,
      content: V1_5_ANNOUNCEMENT_POST.content,
      isPublished: true,
      isPinned: true,
      publishedAt: new Date(),
    }
  });

  console.log('Successfully published v1.5.0 news post:', post.title, `(${post.slug})`);
  console.log('NOTICE: Zero emails sent as requested.');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
