/**
 * Email deliverability and anti-bounce validation.
 * Prevents disposable inboxes, domain typos, and internal/unrouteable addresses
 * from causing SMTP bounces or Delivery Status Notification (Failure) emails.
 */

// Common disposable / burner email domains that bounce or fail delivery
const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "10minutemail.net",
  "20minutemail.com",
  "burnermail.io",
  "crazymailing.com",
  "disposablemail.com",
  "dispostable.com",
  "dropmail.me",
  "fakemailgenerator.com",
  "getnada.com",
  "guerrillamail.biz",
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "inboxkitten.com",
  "maildrop.cc",
  "mailinator.com",
  "mailnesia.com",
  "mailnull.com",
  "mohmal.com",
  "nada.ltd",
  "sharklasers.com",
  "spam4.me",
  "spambog.com",
  "temp-mail.org",
  "tempmail.com",
  "tempmail.net",
  "tempail.com",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.net",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
]);

// Common domain typos mapped to their intended domain
const DOMAIN_TYPOS: Record<string, string> = {
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmaik.com": "gmail.com",
  "gmaul.com": "gmail.com",
  "gemail.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotamail.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outllok.com": "outlook.com",
  "yaho.com": "yahoo.com",
  "yaho.co": "yahoo.com",
  "yahou.com": "yahoo.com",
  "iclud.com": "icloud.com",
  "iclou.com": "icloud.com",
  "prtonmail.com": "protonmail.com",
  "protonmai.com": "protonmail.com",
};

// Forbidden internal or non-internet top-level domains
const FORBIDDEN_TLDS = [
  ".local",
  ".localhost",
  ".invalid",
  ".internal",
  ".lan",
];

// Forbidden placeholder / non-routable domains
const FORBIDDEN_DOMAINS = new Set([
  "ndl.local",
  "nerfeddemonlist.local",
]);

// Reserved documentation domains allowed only in automated test environments
const TEST_PLACEHOLDER_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
]);

function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
}

/**
 * Checks if an email is deliverable over standard internet SMTP.
 * Rejects invalid format, internal TLDs, disposable domains, and typos.
 */
export function isDeliverableEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }

  const trimmed = email.trim().toLowerCase();

  // Basic RFC 5322 regex validation
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return false;
  }

  const parts = trimmed.split("@");
  if (parts.length !== 2) {
    return false;
  }

  const domain = parts[1];
  if (!domain || !domain.includes(".")) {
    return false;
  }

  if (FORBIDDEN_TLDS.some((tld) => domain.endsWith(tld))) {
    return false;
  }

  if (FORBIDDEN_DOMAINS.has(domain)) {
    return false;
  }

  if (!isTestEnvironment() && TEST_PLACEHOLDER_DOMAINS.has(domain)) {
    return false;
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return false;
  }

  if (domain in DOMAIN_TYPOS) {
    return false;
  }

  return true;
}

export type EmailValidationResult =
  | { valid: true }
  | { valid: false; error: string; suggestedDomain?: string };

/**
 * Validates an email specifically for user registration and account operations.
 * Returns actionable, helpful error messages for typos or disposable providers.
 */
export function validateEmailForRegistration(
  email: string | null | undefined,
): EmailValidationResult {
  if (!email || typeof email !== "string" || email.trim().length === 0) {
    return { valid: false, error: "Please enter an email address." };
  }

  const trimmed = email.trim().toLowerCase();

  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: "Please enter a valid email address format." };
  }

  const parts = trimmed.split("@");
  const domain = parts[1];

  if (
    FORBIDDEN_TLDS.some((tld) => domain.endsWith(tld)) ||
    FORBIDDEN_DOMAINS.has(domain) ||
    (!isTestEnvironment() && TEST_PLACEHOLDER_DOMAINS.has(domain))
  ) {
    return {
      valid: false,
      error: "Internal or test email addresses cannot be used for registration.",
    };
  }

  if (domain in DOMAIN_TYPOS) {
    const suggested = DOMAIN_TYPOS[domain];
    return {
      valid: false,
      error: `Did you mean @${suggested}? Please check your email for spelling errors.`,
      suggestedDomain: suggested,
    };
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid: false,
      error: "Temporary and disposable email providers are not permitted.",
    };
  }

  return { valid: true };
}
