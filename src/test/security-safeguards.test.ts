import { describe, expect, it } from "vitest";

import {
  isDeliverableEmail,
  validateEmailForRegistration,
} from "@/lib/email-deliverability";
import { submissionSchema } from "@/lib/validation";

describe("Email Deliverability & Anti-Bounce Safeguards", () => {
  describe("validateEmailForRegistration", () => {
    it("blocks common disposable email domains", () => {
      const disposableEmails = [
        "hacker@mailinator.com",
        "bot@tempmail.com",
        "burner@guerrillamail.com",
        "throwaway@trashmail.com",
        "spam@sharklasers.com",
        "anon@yopmail.com",
      ];

      for (const email of disposableEmails) {
        const result = validateEmailForRegistration(email);
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.error).toContain("disposable email");
        }
      }
    });

    it("detects domain typos and returns helpful suggestions", () => {
      const typoCases = [
        { email: "player@gmai.com", expectedDomain: "gmail.com" },
        { email: "player@gamil.com", expectedDomain: "gmail.com" },
        { email: "runner@hotmial.com", expectedDomain: "hotmail.com" },
        { email: "victor@outlok.com", expectedDomain: "outlook.com" },
        { email: "demon@yaho.com", expectedDomain: "yahoo.com" },
      ];

      for (const { email, expectedDomain } of typoCases) {
        const result = validateEmailForRegistration(email);
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.suggestedDomain).toBe(expectedDomain);
          expect(result.error).toContain(`@${expectedDomain}`);
        }
      }
    });

    it("blocks unrouteable internal and local TLDs", () => {
      const internalEmails = [
        "guest@nerfeddemonlist.local",
        "admin@ndl.local",
        "user@server.localhost",
        "tester@node.internal",
        "player@home.lan",
      ];

      for (const email of internalEmails) {
        const result = validateEmailForRegistration(email);
        expect(result.valid).toBe(false);
      }
    });

    it("accepts valid, deliverable public email addresses", () => {
      const validEmails = [
        "cattwgd@gmail.com",
        "legit_victor@yahoo.com",
        "runner99@outlook.com",
        "demon_slayer@proton.me",
        "gd_player@icloud.com",
      ];

      for (const email of validEmails) {
        const result = validateEmailForRegistration(email);
        expect(result.valid).toBe(true);
      }
    });
  });

  describe("isDeliverableEmail", () => {
    it("returns false for guest and local addresses that cause 550 delivery status notifications", () => {
      expect(isDeliverableEmail("rec_guest_123@nerfeddemonlist.local")).toBe(false);
      expect(isDeliverableEmail("submitter@server.local")).toBe(false);
      expect(isDeliverableEmail("bot@mailinator.com")).toBe(false);
      expect(isDeliverableEmail("typo@gmai.com")).toBe(false);
      expect(isDeliverableEmail("")).toBe(false);
      expect(isDeliverableEmail(null)).toBe(false);
      expect(isDeliverableEmail(undefined)).toBe(false);
    });

    it("returns true for deliverable public email addresses", () => {
      expect(isDeliverableEmail("owner@gmail.com")).toBe(true);
      expect(isDeliverableEmail("player@outlook.com")).toBe(true);
    });
  });
});

describe("Mandatory Microphone Proof Policy", () => {
  const baseValidSubmission = {
    levelId: "level_abyssal_mercy",
    videoUrl: "https://youtube.com/watch?v=12345678901",
    fps: "360",
    inputDevice: "Razer DeathAdder V3 Pro",
    progress: "100",
  };

  it("strictly rejects submissions without audible microphone click audio", () => {
    const withoutMic = submissionSchema.safeParse({
      ...baseValidSubmission,
      clickAudioIncluded: false,
    });

    expect(withoutMic.success).toBe(false);
    if (!withoutMic.success) {
      expect(
        withoutMic.error.flatten().fieldErrors.clickAudioIncluded,
      ).toContain(
        "Audible microphone/click proof is strictly mandatory for all submissions. Please confirm your video contains audible clicks.",
      );
    }
  });

  it("strictly rejects submissions that omit clickAudioIncluded entirely", () => {
    const omittedMic = submissionSchema.safeParse(baseValidSubmission);

    expect(omittedMic.success).toBe(false);
    if (!omittedMic.success) {
      expect(
        omittedMic.error.flatten().fieldErrors.clickAudioIncluded,
      ).toContain(
        "Audible microphone/click proof is strictly mandatory for all submissions. Please confirm your video contains audible clicks.",
      );
    }
  });

  it("accepts submissions when audible microphone click audio is confirmed", () => {
    const withMic = submissionSchema.safeParse({
      ...baseValidSubmission,
      clickAudioIncluded: true,
      microphoneModel: "HyperX QuadCast",
    });

    expect(withMic.success).toBe(true);
    if (withMic.success) {
      expect(withMic.data.clickAudioIncluded).toBe(true);
      expect(withMic.data.microphoneModel).toBe("HyperX QuadCast");
    }
  });
});
