import { describe, expect, it } from "vitest";
import {
  validatePhysicsParameters,
  validateProofUrl,
} from "@/lib/proof-security";

describe("Proof Security & Anti-Cheat Analyzer", () => {
  describe("validateProofUrl", () => {
    it("rejects deceptive URL shorteners", () => {
      const shorteners = [
        "https://bit.ly/3xDemonRun",
        "http://tinyurl.com/fake-proof",
        "https://t.co/xyz123",
        "https://goo.gl/short-link",
        "https://is.gd/demon123",
        "https://shorturl.at/abcde",
        "https://linktr.ee/sus-runner",
      ];

      for (const url of shorteners) {
        const result = validateProofUrl(url);
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.reason).toContain("URL shorteners");
        }
      }
    });

    it("rejects raw IP addresses or non-standard ports", () => {
      const rawIps = [
        "http://192.168.1.1/video.mp4",
        "http://10.0.0.1:8080/proof.mp4",
        "https://youtube.com:8443/watch?v=123",
      ];

      for (const url of rawIps) {
        const result = validateProofUrl(url);
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.reason).toContain("IP addresses or non-standard ports");
        }
      }
    });

    it("rejects unsupported suspicious platforms", () => {
      const unsupported = [
        "https://malicious-site.ru/run.mp4",
        "https://unknown-host.biz/video",
        "https://file-dropper.net/download",
      ];

      for (const url of unsupported) {
        const result = validateProofUrl(url);
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.reason).toContain("Unsupported proof host");
        }
      }
    });

    it("accepts recognized video proof platforms", () => {
      const validProofLinks = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://youtu.be/dQw4w9WgXcQ",
        "https://twitch.tv/videos/1234567890",
        "https://medal.tv/games/geometry-dash/clips/abc123xyz",
        "https://www.tiktok.com/@runner/video/1234567890123456789",
        "https://www.bilibili.com/video/BV1xx411c7mD",
        "https://streamable.com/abc123",
        "https://drive.google.com/file/d/123456789/view",
        "https://mega.nz/file/abc123#xyz",
        "/uploads/completion-videos/run-123.mp4",
      ];

      for (const url of validProofLinks) {
        const result = validateProofUrl(url);
        expect(result.valid).toBe(true);
      }
    });
  });

  describe("validatePhysicsParameters", () => {
    it("accepts valid FPS and progress values", () => {
      expect(validatePhysicsParameters({ fps: 240, progress: 100 }).valid).toBe(true);
      expect(validatePhysicsParameters({ fps: 360, progress: 50 }).valid).toBe(true);
      expect(validatePhysicsParameters({ fps: 60, progress: 30 }).valid).toBe(true);
      expect(validatePhysicsParameters({ fps: 1000, progress: 100 }).valid).toBe(true);
    });

    it("rejects impossible or non-integer FPS claims", () => {
      expect(validatePhysicsParameters({ fps: 240.5, progress: 100 }).valid).toBe(false);
      expect(validatePhysicsParameters({ fps: 20, progress: 100 }).valid).toBe(false);
      expect(validatePhysicsParameters({ fps: 1500, progress: 100 }).valid).toBe(false);
    });

    it("rejects invalid progress claims", () => {
      expect(validatePhysicsParameters({ fps: 240, progress: 25 }).valid).toBe(false);
      expect(validatePhysicsParameters({ fps: 240, progress: 105 }).valid).toBe(false);
      expect(validatePhysicsParameters({ fps: 240, progress: 55.5 }).valid).toBe(false);
    });
  });
});
