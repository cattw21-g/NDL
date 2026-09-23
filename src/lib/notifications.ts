import { prisma } from "@/lib/db";

export async function createUserNotification(params: {
  userId: string;
  title: string;
  message: string;
  link?: string;
  type?: string;
}) {
  try {
    return await prisma.userNotification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        link: params.link,
        type: params.type || "GENERAL",
      },
    });
  } catch (err) {
    console.error("Failed to create user notification:", err);
    return null;
  }
}

export async function getUserNotifications(userId: string, limit = 20) {
  try {
    return await prisma.userNotification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (err) {
    console.error("Failed to fetch user notifications:", err);
    return [];
  }
}

export async function markNotificationRead(id: string, userId: string) {
  try {
    return await prisma.userNotification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  } catch (err) {
    console.error("Failed to mark notification read:", err);
    return null;
  }
}

export async function markAllNotificationsRead(userId: string) {
  try {
    return await prisma.userNotification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  } catch (err) {
    console.error("Failed to mark all notifications read:", err);
    return null;
  }
}
