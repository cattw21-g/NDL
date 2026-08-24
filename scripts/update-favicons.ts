import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

async function main() {
  const sourceImage = "C:/Users/cat97/.gemini/antigravity/brain/02297bf2-b1c1-4fa2-927a-5961238d30fc/.user_uploaded/media_1787603549410.png";

  const root = process.cwd();
  const destinations = [
    { file: path.join(root, "public", "logo.png"), size: 512 },
    { file: path.join(root, "public", "icon.png"), size: 512 },
    { file: path.join(root, "public", "email-logo.png"), size: 128 },
    { file: path.join(root, "src", "app", "icon.png"), size: 512 },
    { file: path.join(root, "public", "favicon.ico"), size: 64 },
    { file: path.join(root, "src", "app", "favicon.ico"), size: 64 },
  ];

  console.log("🎨 Updating favicons and icons from user uploaded image...");

  for (const dest of destinations) {
    const dir = path.dirname(dest.file);
    await fs.mkdir(dir, { recursive: true });
    await sharp(sourceImage)
      .resize(dest.size, dest.size)
      .toFile(dest.file);
    console.log(`✅ Saved ${dest.size}x${dest.size} to ${path.relative(root, dest.file)}`);
  }

  console.log("🎉 All favicons and site icons successfully updated!");
}

main().catch(console.error);
