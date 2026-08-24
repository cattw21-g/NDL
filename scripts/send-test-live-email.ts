import "dotenv/config";
import { sendNewsBroadcastEmail } from "../src/lib/email.js";
import { absoluteSiteUrl } from "../src/lib/site-url.js";

async function main() {
  console.log("📨 Sending Live Test News Email via Resend SMTP...");

  const recipient = "cattwgd@gmail.com";
  console.log(`Sending test email to: ${recipient}`);

  try {
    await sendNewsBroadcastEmail({
      to: recipient,
      recipientName: "cattw_gd",
      title: "🎉 Official Nerfed Demonlist Discord Server & Bot is Live!",
      summary:
        "We are thrilled to officially launch the Nerfed Demonlist Discord Server, featuring 24/7 automated record broadcasts, live bot commands, interactive role selection, and an active community hub for Geometry Dash nerfed extremes!",
      category: "ANNOUNCEMENT",
      articleUrl: absoluteSiteUrl("/changelog/official-discord-server-and-bot-launched"),
    });

    console.log("✅ Live test email sent successfully via Resend!");
  } catch (err) {
    console.error("❌ Email delivery error:", err);
  }
}

main().catch(console.error);
