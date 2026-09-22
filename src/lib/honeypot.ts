/**
 * Anti-Bot Honeypot Protection.
 * Silently detects and blocks automated spam bots without CAPTCHA friction for human players.
 */

export const HONEYPOT_FIELD_NAME = "website_url_hp";

/**
 * Checks whether a form submission was triggered by an automated bot.
 * Bots autofill all form inputs, including invisible honeypot fields.
 */
export function isBotSubmission(formData: FormData): boolean {
  const honeypotVal = formData.get(HONEYPOT_FIELD_NAME);
  if (typeof honeypotVal === "string" && honeypotVal.trim().length > 0) {
    return true;
  }
  return false;
}
