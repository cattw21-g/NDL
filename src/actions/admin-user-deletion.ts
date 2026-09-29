"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { deleteAccountAsAdmin } from "@/lib/account-deletion";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function deleteUserAsAdminAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = formData.get("userId");
  const playerName = formData.get("playerName");

  if (typeof userId !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(userId) ||
      typeof playerName !== "string" || !playerName) {
    redirect("/admin/users?error=invalid");
  }

  const detailPath = `/admin/users/${encodeURIComponent(userId)}/delete`;
  let result: Awaited<ReturnType<typeof deleteAccountAsAdmin>>;
  try {
    result = await deleteAccountAsAdmin(prisma, admin, userId, playerName);
  } catch (error) {
    console.error("Admin account deletion failed:", error);
    redirect(`${detailPath}?error=delete-failed`);
  }

  if (result !== "deleted") {
    redirect(`${detailPath}?error=${result}`);
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/audit");
  revalidatePath("/players");
  revalidatePath(`/players/${playerName}`);
  revalidatePath("/stats");
  revalidatePath("/countries");
  redirect("/admin/users?deleted=1");
}
