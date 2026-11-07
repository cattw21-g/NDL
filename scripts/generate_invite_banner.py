import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ART_DIR = r"C:\Users\cat97\.gemini\antigravity\brain\02297bf2-b1c1-4fa2-927a-5961238d30fc"

def get_font(name, size):
    font_dir = r"C:\Windows\Fonts"
    for c in [name, "segoeuib.ttf", "arialbd.ttf", "impact.ttf", "SegoeUI.ttf", "arial.ttf"]:
        p = os.path.join(font_dir, c)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def generate_invite_banner():
    W, H = 1920, 1080
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

    # Rich deep navy background with smooth radial cyan/blue atmospheric lighting (opaque RGB!)
    bg = np.zeros((H, W, 3), dtype=np.float32)
    bg[:, :, 0] = 4.0
    bg[:, :, 1] = 10.0
    bg[:, :, 2] = 22.0

    # Left logo spotlight glow (smooth Gaussian, zero hard circle edges!)
    d_logo = np.sqrt((xx - 390.0) ** 2 + (yy - 540.0) ** 2)
    glow_left = np.exp(-(d_logo ** 2) / (2.0 * 280.0 ** 2))
    bg[:, :, 0] += glow_left * 12.0
    bg[:, :, 1] += glow_left * 95.0
    bg[:, :, 2] += glow_left * 155.0

    # Right header ambient glow
    d_right = np.sqrt(((xx - 1150.0) * 0.6) ** 2 + (yy - 420.0) ** 2)
    glow_right = np.exp(-(d_right ** 2) / (2.0 * 340.0 ** 2))
    bg[:, :, 0] += glow_right * 8.0
    bg[:, :, 1] += glow_right * 45.0
    bg[:, :, 2] += glow_right * 85.0

    img = Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8), "RGB")
    draw = ImageDraw.Draw(img)

    # Subtle cyber grid lines (100% opaque dark blue tones)
    for gx in range(0, W, 80):
        draw.line([(gx, 0), (gx, H)], fill=(9, 20, 38), width=1)
    for gy in range(0, H, 80):
        draw.line([(0, gy), (W, gy)], fill=(9, 20, 38), width=1)

    # Crisp ambient star particles in background margins
    np.random.seed(42)
    for _ in range(45):
        px = int(np.random.uniform(40, W - 40))
        py = int(np.random.uniform(40, H - 40))
        # Keep away from text & cards area (x=680..1840, y=200..820) and logo area (x=140..640, y=290..790)
        if (660 < px < 1850 and 190 < py < 830) or (130 < px < 650 and 280 < py < 800):
            continue
        is_gold = np.random.rand() < 0.25
        c_outer = (85, 70, 20) if is_gold else (14, 65, 105)
        c_inner = (250, 204, 21) if is_gold else (56, 189, 248)
        r = int(np.random.choice([3, 4, 5]))
        draw.ellipse([px - r - 3, py - r - 3, px + r + 3, py + r + 3], fill=c_outer)
        draw.ellipse([px - r, py - r, px + r, py + r], fill=c_inner)

    # Paste high-res NDL Emblem on the left with rounded-square alpha mask so there is zero outer square box!
    logo = Image.open("public/logo.png").convert("RGBA").resize((460, 460), Image.Resampling.LANCZOS)
    logo_mask = Image.new("L", (460, 460), 0)
    ImageDraw.Draw(logo_mask).rounded_rectangle([32, 32, 428, 428], radius=72, fill=255)
    logo_mask = logo_mask.filter(ImageFilter.GaussianBlur(radius=3))
    img.paste(logo, (160, 310), logo_mask)

    # Right column content (starts at x=720)
    f_pill = get_font("segoeuib.ttf", 20)
    f_title = get_font("segoeuib.ttf", 88)
    f_sub = get_font("SegoeUI.ttf", 30)
    f_card_tag = get_font("segoeuib.ttf", 17)
    f_card_title = get_font("segoeuib.ttf", 27)
    f_card_body = get_font("SegoeUI.ttf", 20)
    f_footer = get_font("segoeuib.ttf", 22)

    # 1. Top "OFFICIAL GEOMETRY DASH COMMUNITY" pill
    draw.rounded_rectangle([720, 225, 1175, 273], radius=24, fill=(8, 28, 52), outline=(56, 189, 248), width=2)
    draw.ellipse([742, 243, 754, 255], fill=(56, 189, 248))
    draw.text((768, 249), "OFFICIAL GEOMETRY DASH COMMUNITY", font=f_pill, fill=(224, 242, 254), anchor="lm")

    # 2. Main Heading: NERFED DEMONLIST
    draw.text((724, 345), "NERFED DEMONLIST", font=f_title, fill=(2, 6, 14), anchor="lm")
    draw.text((720, 340), "NERFED DEMONLIST", font=f_title, fill=(255, 255, 255), anchor="lm")

    # 3. Subtitle
    draw.text(
        (720, 420),
        "The premier competitive leaderboard for reviewed & approved nerfed demon records.",
        font=f_sub,
        fill=(148, 163, 184),
        anchor="lm",
    )

    # 4. Three Feature Cards (100% opaque deep slate-navy with glowing top accent bar)
    cards = [
        {
            "x": 720,
            "tag": "RANKED LIST",
            "tag_bg": (12, 52, 82),
            "tag_fg": (56, 189, 248),
            "accent": (56, 189, 248),
            "title": "Demon Leaderboard",
            "line1": "Curated & approved nerfed levels",
            "line2": "Real-time points & tier rankings",
        },
        {
            "x": 1095,
            "tag": "VERIFICATION",
            "tag_bg": (68, 48, 12),
            "tag_fg": (250, 204, 21),
            "accent": (250, 204, 21),
            "title": "Strict Proof Standard",
            "line1": "Full click-audio inspection",
            "line2": "CBF & high-FPS rules enforcement",
        },
        {
            "x": 1470,
            "tag": "COMMUNITY",
            "tag_bg": (10, 58, 42),
            "tag_fg": (52, 211, 153),
            "accent": (52, 211, 153),
            "title": "Global & Staff Voting",
            "line1": "Country leaderboards & stats",
            "line2": "Active staff review & suggestions",
        },
    ]

    for c in cards:
        cx0 = c["x"]
        cy0 = 475
        cw, ch = 350, 195
        # Card box
        draw.rounded_rectangle([cx0, cy0, cx0 + cw, cy0 + ch], radius=20, fill=(10, 22, 42), outline=(30, 58, 95), width=2)
        # Top accent line
        draw.rounded_rectangle([cx0 + 24, cy0, cx0 + 135, cy0 + 5], radius=2, fill=c["accent"])
        # Tag pill
        draw.rounded_rectangle([cx0 + 24, cy0 + 24, cx0 + 175, cy0 + 54], radius=15, fill=c["tag_bg"], outline=c["accent"], width=1)
        draw.text((cx0 + 99, cy0 + 39), c["tag"], font=f_card_tag, fill=c["tag_fg"], anchor="mm")
        # Card Title
        draw.text((cx0 + 24, cy0 + 82), c["title"], font=f_card_title, fill=(255, 255, 255), anchor="lm")
        # Card Body lines
        draw.text((cx0 + 24, cy0 + 124), c["line1"], font=f_card_body, fill=(148, 163, 184), anchor="lm")
        draw.text((cx0 + 24, cy0 + 154), c["line2"], font=f_card_body, fill=(148, 163, 184), anchor="lm")

    # 5. Bottom Website & Status Bar (High-contrast dark navy pill with bright cyan/white text)
    draw.rounded_rectangle([720, 710, 1650, 774], radius=18, fill=(8, 24, 46), outline=(56, 189, 248), width=2)
    draw.text((750, 742), "WEBSITE:", font=f_footer, fill=(56, 189, 248), anchor="lm")
    draw.text((862, 742), "www.nerfeddemonlist.net", font=f_footer, fill=(255, 255, 255), anchor="lm")
    draw.line([(1160, 724), (1160, 760)], fill=(30, 58, 95), width=2)
    draw.ellipse([1190, 735, 1204, 749], fill=(52, 211, 153))
    draw.text((1218, 742), "128 KBPS AUDIO & TIER 1 BOOSTED", font=f_footer, fill=(167, 243, 208), anchor="lm")

    out_path = "public/server-invite-banner.png"
    art_path = os.path.join(ART_DIR, "server-invite-banner.png")
    img.save(out_path, "PNG", optimize=True)
    img.save(art_path, "PNG", optimize=True)
    print(f"Saved invite banner ({os.path.getsize(out_path) // 1024} KB)")

if __name__ == "__main__":
    generate_invite_banner()
