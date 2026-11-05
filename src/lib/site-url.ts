function isValidHttpUrl(candidate?: string): boolean {
  if (!candidate) return false;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getSiteUrl(env: NodeJS.ProcessEnv = process.env) {
  const publicUrl = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (isValidHttpUrl(publicUrl)) {
    return trimTrailingSlash(publicUrl!);
  }
  const appUrl = env.APP_URL?.trim();
  if (isValidHttpUrl(appUrl)) {
    return trimTrailingSlash(appUrl!);
  }
  return "https://www.nerfeddemonlist.net";
}

export function absoluteSiteUrl(pathname = "/", env: NodeJS.ProcessEnv = process.env) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getSiteUrl(env)}${normalizedPath}`;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}
