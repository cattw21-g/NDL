"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { COUNTRIES } from "@/lib/countries";
import { prisma } from "@/lib/db";

function parseSocialUrl(raw: unknown, label: string): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const trimmed = raw.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      redirect(`/settings?error=${encodeURIComponent(`${label} must start with https://`)}`);
    }
    return parsed.toString();
  } catch {
    redirect(`/settings?error=${encodeURIComponent(`Please enter a valid URL for ${label}.`)}`);
  }
}

export async function updateProfileAction(formData: FormData): Promise<void> {
  const user = await requireUser();

  const rawCountryCode = formData.get("countryCode");
  const rawSubdivision = formData.get("subdivision");
  const rawDisplayName = formData.get("displayName");
  const rawBio = formData.get("bio");

  let countryCode: string | null = null;
  if (typeof rawCountryCode === "string" && rawCountryCode.trim().length > 0) {
    const upper = rawCountryCode.trim().toUpperCase();
    if (upper in COUNTRIES) {
      countryCode = upper;
    } else {
      redirect(`/settings?error=${encodeURIComponent("Selected country is not supported.")}`);
    }
  }

  let subdivision: string | null = null;
  if (typeof rawSubdivision === "string" && rawSubdivision.trim().length > 0) {
    subdivision = rawSubdivision.trim().slice(0, 50);
  }

  let displayName = user.displayName;
  if (typeof rawDisplayName === "string" && rawDisplayName.trim().length > 0) {
    const trimmed = rawDisplayName.trim();
    if (trimmed.length < 2 || trimmed.length > 32) {
      redirect(
        `/settings?error=${encodeURIComponent("Display name must be between 2 and 32 characters.")}`,
      );
    }
    displayName = trimmed;
  }

  let bio: string | null = null;
  if (typeof rawBio === "string" && rawBio.trim().length > 0) {
    const trimmed = rawBio.trim();
    if (trimmed.length > 500) {
      redirect(`/settings?error=${encodeURIComponent("Bio must be 500 characters or less.")}`);
    }
    bio = trimmed;
  }

  const youtubeUrl = parseSocialUrl(formData.get("youtubeUrl"), "YouTube URL");
  const twitchUrl = parseSocialUrl(formData.get("twitchUrl"), "Twitch URL");
  const twitterUrl = parseSocialUrl(formData.get("twitterUrl"), "Twitter / X URL");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      countryCode,
      subdivision,
      displayName,
      bio,
      youtubeUrl,
      twitchUrl,
      twitterUrl,
    },
  });

  revalidatePath("/settings");
  revalidatePath(`/players/${user.playerName}`);
  revalidatePath("/countries");
  if (countryCode) {
    revalidatePath(`/countries/${countryCode.toLowerCase()}`);
  }
  if (user.countryCode) {
    revalidatePath(`/countries/${user.countryCode.toLowerCase()}`);
  }

  redirect("/settings?updated=1");
}
