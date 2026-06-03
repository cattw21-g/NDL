export function getSiteUrl(env: NodeJS.ProcessEnv = process.env) {
  return trimTrailingSlash(
    env.NEXT_PUBLIC_SITE_URL?.trim() ||
      env.APP_URL?.trim() ||
      "https://www.nerfeddemonlist.net",
  );
}

export function absoluteSiteUrl(pathname = "/", env: NodeJS.ProcessEnv = process.env) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getSiteUrl(env)}${normalizedPath}`;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}
