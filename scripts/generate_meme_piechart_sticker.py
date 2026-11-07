import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont

def generate_piechart_sticker():
    # 640x640 base for ultra-sharp downscale to 320x320 Discord sticker standard
    size = 640
    im = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    draw = ImageDraw.Draw(im)

    try:
        font_title = ImageFont.truetype("arial.ttf", 46)
        font_sub = ImageFont.truetype("arial.ttf", 26)
    except Exception:
        font_title = ImageFont.load_default()
        font_sub = font_title

    # Top text
    # Line 1: Things I have done since
    # Line 2: NDL went down
    draw.text((size // 2, 60), "Things I have done since", fill=(0, 0, 0, 255), font=font_title, anchor="mt")
    draw.text((size // 2, 120), "NDL went down", fill=(0, 0, 0, 255), font=font_title, anchor="mt")

    # Subtext on the left under Line 2 (exactly like the meme)
    draw.text((25, 180), "(It's been 25\nminutes I think)", fill=(0, 0, 0, 255), font=font_sub, spacing=4)

    # Circular Pie Chart in the center (radius ~195px, center at x=330, y=410)
    cx, cy, r = 340, 415, 190

    # Draw gradient / glowing ring around the pie chart (gold to purple/cyan gradient like the original)
    num_steps = 180
    for i in range(num_steps):
        a1 = i * (360.0 / num_steps)
        a2 = (i + 1) * (360.0 / num_steps)
        # Angle determines color: gold (top-left) to cyan/purple (bottom-right)
        rad = math.radians(a1)
        interp = (math.sin(rad) + 1.0) / 2.0
        # Blend from warm gold (245, 215, 150) to purple-cyan (120, 100, 220)
        cr = int(245 * (1 - interp) + 80 * interp)
        cg = int(215 * (1 - interp) + 140 * interp)
        cb = int(140 * (1 - interp) + 230 * interp)
        draw.arc([cx - r - 8, cy - r - 8, cx + r + 8, cy + r + 8], start=a1, end=a2+1, fill=(cr, cg, cb, 255), width=16)

    # Fill pie chart interior circle with dark background
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(15, 23, 42, 255))

    # Paste circular cropped NDL Logo inside the pie chart!
    logo = Image.open('public/logo.png').convert('RGBA')
    logo_dim = int(r * 2)
    logo_resized = logo.resize((logo_dim, logo_dim), Image.Resampling.LANCZOS)

    # Circle mask
    mask = Image.new("L", (logo_dim, logo_dim), 0)
    d_mask = ImageDraw.Draw(mask)
    d_mask.ellipse([0, 0, logo_dim, logo_dim], fill=255)

    im.paste(logo_resized, (cx - r, cy - r), mask=mask)

    # Inner subtle rim shadow
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(30, 41, 59, 180), width=3)

    # Save 640x640 and high-res 320x320 for Discord sticker
    out_320 = "public/stickers/ndl_piechart_meme.png"
    im_320 = im.resize((320, 320), Image.Resampling.LANCZOS)
    im_320.save(out_320, "PNG", optimize=True)
    print(f"[SUCCESS] Saved pie chart meme sticker to {out_320}")

if __name__ == "__main__":
    generate_piechart_sticker()
