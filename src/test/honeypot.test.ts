import { describe, expect, it } from "vitest";
import { HONEYPOT_FIELD_NAME, isBotSubmission } from "@/lib/honeypot";

describe("Anti-Bot Honeypot Mechanism", () => {
  it("flags bot submissions when honeypot field is filled", () => {
    const formData = new FormData();
    formData.set(HONEYPOT_FIELD_NAME, "https://spambot-link.com");
    formData.set("playerName", "SpamBot");

    expect(isBotSubmission(formData)).toBe(true);
  });

  it("permits human submissions when honeypot field is empty", () => {
    const formData = new FormData();
    formData.set(HONEYPOT_FIELD_NAME, "");
    formData.set("playerName", "LegitPlayer");

    expect(isBotSubmission(formData)).toBe(false);
  });

  it("permits human submissions when honeypot field is omitted", () => {
    const formData = new FormData();
    formData.set("playerName", "LegitPlayer");

    expect(isBotSubmission(formData)).toBe(false);
  });
});
