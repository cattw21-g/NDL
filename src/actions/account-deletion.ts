"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { deleteAccountData } from "@/lib/account-deletion";
import { isCurrentSessionRecent, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

function deletionError(message: string): never {
  redirect(`/settings/delete-account?error=${encodeURIComponent(message)}`);
}

export async function deleteOwnAccountAction(formData: FormData) {
  const user = await requireUser();

  if (!(await isCurrentSessionRecent())) {
    deletionError("For your security, sign out and sign in again before deleting your account.");
  }

  if (
    formData.get("confirmation") !== `DELETE ${user.playerName}` ||
    formData.get("understood") !== "yes"
  ) {
    deletionError(`Type DELETE ${user.playerName} and check the confirmation box.`);
  }

  try {
    await deleteAccountData(prisma, user.id);
  } catch (error) {
    console.error("Account deletion failed:", error);
    deletionError("Your account was not deleted. Please try again or contact staff.");
  }

  (await cookies()).delete(process.env.SESSION_COOKIE_NAME ?? "ndl_session");
  revalidatePath("/players");
  revalidatePath(`/players/${user.playerName}`);
  revalidatePath("/stats");
  revalidatePath("/countries");
  redirect("/login?deleted=1");
}
