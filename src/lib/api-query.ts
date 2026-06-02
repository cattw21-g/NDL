export const defaultApiLimit = 25;
export const maxApiLimit = 50;

export function parseApiLimit(searchParams: URLSearchParams) {
  const rawLimit = Number(searchParams.get("limit") ?? defaultApiLimit);

  if (!Number.isInteger(rawLimit) || rawLimit < 1) {
    return defaultApiLimit;
  }

  return Math.min(rawLimit, maxApiLimit);
}

export function parseApiSearch(searchParams: URLSearchParams, key = "q") {
  return (searchParams.get(key) ?? "").trim().slice(0, 160);
}
