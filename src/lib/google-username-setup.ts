import { prisma } from "@/lib/db";

export const GOOGLE_USERNAME_SETUP_MARKER = "GOOGLE_USERNAME_SETUP_COMPLETE";

export async function hasCompletedGoogleUsernameSetup(userId: string) {
  const marker = await prisma.userNotification.findFirst({
    where: { userId, type: GOOGLE_USERNAME_SETUP_MARKER },
    select: { id: true },
  });
  return Boolean(marker);
}

export async function markGoogleUsernameSetupComplete(userId: string) {
  await prisma.userNotification.create({
    data: {
      userId,
      type: GOOGLE_USERNAME_SETUP_MARKER,
      title: "Google username setup completed",
      message: "",
      read: true,
    },
  });
}
