import "dotenv/config";
import nodemailer from "nodemailer";

async function main() {
  console.log("🧪 Testing Resend SMTP Connection...");

  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT?.trim() || "465");
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD?.trim();

  console.log(`Connecting to ${host}:${port} (secure=${secure}, user=${user})...`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  await transporter.verify();
  console.log("✅ Resend SMTP Server connection verified successfully!");
}

main().catch((err) => {
  console.error("❌ SMTP Verification failed:", err);
});
