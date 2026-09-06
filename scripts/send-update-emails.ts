import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { requireDatabaseUrl } from '../src/lib/production-env';
import { V1_5_ANNOUNCEMENT_POST } from '../src/lib/changelog';
import { sendNewsBroadcastEmail } from '../src/lib/email';

const connectionString = requireDatabaseUrl(process.env, 'send update emails');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  console.log('Sending v1.5.0 update announcement emails...');

  const users = await prisma.user.findMany({
    select: {
      email: true,
      displayName: true,
      playerName: true,
    }
  });

  const recipients = new Map<string, string>();

  // Add the site owner/admin email from SMTP_FROM or SMTP_USER
  const adminEmail = process.env.SMTP_USER || 'cattwgd@gmail.com';
  recipients.set(adminEmail, 'cattw21');

  for (const u of users) {
    if (u.email && !u.email.endsWith('.local') && u.email.includes('@')) {
      recipients.set(u.email, u.displayName || u.playerName);
    }
  }

  console.log(`Found ${recipients.size} real recipient(s) to notify.`);

  for (const [email, name] of recipients.entries()) {
    try {
      console.log(`Sending update broadcast to ${name} <${email}>...`);
      await sendNewsBroadcastEmail({
        to: email,
        recipientName: name,
        title: V1_5_ANNOUNCEMENT_POST.title,
        summary: V1_5_ANNOUNCEMENT_POST.summary,
        category: "ANNOUNCEMENT",
        articleUrl: `https://www.nerfeddemonlist.net/changelog/${V1_5_ANNOUNCEMENT_POST.slug}`,
      });
      console.log(`  -> Sent successfully to ${email}!`);
    } catch (err) {
      console.error(`  -> Failed to send to ${email}:`, err);
    }
  }

  console.log('Finished sending update emails.');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
