import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT_DIR = "public/stickers"
ART_DIR = r"C:\Users\cat97\.gemini\antigravity\brain\02297bf2-b1c1-4fa2-927a-5961238d30fc"
os.makedirs(OUT_DIR, exist_ok=True)

def get_font(name, size):
    font_Dir = r"C:\Windows\Fonts"
    candidates = [name, "impact.ttf", "arialbd.ttf", "arial.ttf", "segoeuib.ttf"]
    for c in candidates:
        p = os.path.join(font_Dir, c)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def draw_text_centered(draw, x, y, text, font, fill, stroke_fill=(0, 0, 0, 255), stroke_width=0):
    draw.text(
        (x, y),
        text,
        font=font,
        fill=fill,
        anchor="mm",
        stroke_width=stroke_width,
        stroke_fill=stroke_fill if stroke_width > 0 else None,
    )

def save_sticker(img_4x, filename):
    # Downscale from 1280x1280 to 320x320 using LANCZOS for razor-sharp anti-aliasing
    final = img_4x.resize((320, 320), Image.Resampling.LANCZOS)
    out_path = os.path.join(OUT_DIR, filename)
    art_path = os.path.join(ART_DIR, filename)
    final.save(out_path, "PNG", optimize=True)
    final.save(art_path, "PNG", optimize=True)
    print(f"Saved {filename} ({os.path.getsize(out_path) // 1024} KB)")

# ==============================================================================
# 1. NDL PIE CHART MEME ("Things I have done since NDL went down")
# Matches the exact Geode meme layout with smooth NumPy anti-aliased circle
# ==============================================================================
def make_ndl_piechart_meme():
    W = 1280
    # Start with pure white background
    canvas = np.full((W, W, 4), 255, dtype=np.uint8)

    # Circle parameters at 4x (1280x1280)
    cx, cy = 640.0, 815.0
    r_outer_border = 416.0
    r_ring_outer = 410.0
    r_ring_inner = 362.0
    r_inner_border = 356.0

    yy, xx = np.mgrid[0:W, 0:W]
    dx = xx - cx
    dy = yy - cy
    dist = np.sqrt(dx * dx + dy * dy)
    angle = (np.arctan2(dy, dx) + np.pi) / (2 * np.pi)  # 0..1

    # Smooth gradient ring matching NDL + Geode meme vibe (Cyan -> Gold/Cream -> Electric Blue -> Neon Purple -> Cyan)
    # Wait: let's make it look super sleek with NDL's cyan/blue/gold/purple gradient like the reference!
    # In the reference image, top-left is warm gold/cream (252, 226, 156) transitioning to purple/indigo (138, 108, 209) on bottom-right, or NDL cyan (0, 225, 255) to royal purple (130, 90, 240)
    t = np.sin(angle * np.pi * 2.0 - 0.8) * 0.5 + 0.5
    r_col = (56 * (1 - t) + 145 * t).astype(np.uint8)
    g_col = (225 * (1 - t) + 115 * t).astype(np.uint8)
    b_col = (255 * (1 - t) + 245 * t).astype(np.uint8)

    # Anti-aliased outer dark rim
    rim_color = np.array([85, 80, 105, 255], dtype=np.uint8)
    inner_bg = np.array([8, 22, 39, 255], dtype=np.uint8)

    # Apply layers from outside in with 1.5px anti-aliased feathering
    def smoothstep(edge0, edge1, x):
        v = np.clip((x - edge0) / (edge1 - edge0), 0.0, 1.0)
        return v * v * (3 - 2 * v)

    # 1. Outer border
    alpha_outer = 1.0 - smoothstep(r_outer_border - 2.0, r_outer_border + 2.0, dist)
    for c in range(3):
        canvas[:, :, c] = (canvas[:, :, c] * (1 - alpha_outer) + rim_color[c] * alpha_outer).astype(np.uint8)

    # 2. Gradient ring
    alpha_ring = 1.0 - smoothstep(r_ring_outer - 2.0, r_ring_outer + 2.0, dist)
    ring_rgb = np.stack([r_col, g_col, b_col], axis=-1)
    for c in range(3):
        canvas[:, :, c] = (canvas[:, :, c] * (1 - alpha_ring) + ring_rgb[:, :, c] * alpha_ring).astype(np.uint8)

    # 3. Inner border between ring and dark center
    alpha_in_rim = 1.0 - smoothstep(r_ring_inner - 2.0, r_ring_inner + 2.0, dist)
    for c in range(3):
        canvas[:, :, c] = (canvas[:, :, c] * (1 - alpha_in_rim) + rim_color[c] * alpha_in_rim).astype(np.uint8)

    # 4. Dark NDL center with subtle smooth radial glow matching NDL brand
    alpha_center = 1.0 - smoothstep(r_inner_border - 2.0, r_inner_border + 2.0, dist)
    radial_t = np.clip(dist / r_inner_border, 0.0, 1.0)
    center_r = (15 * (1 - radial_t) + 6 * radial_t).astype(np.uint8)
    center_g = (40 * (1 - radial_t) + 15 * radial_t).astype(np.uint8)
    center_b = (70 * (1 - radial_t) + 28 * radial_t).astype(np.uint8)
    center_rgb = np.stack([center_r, center_g, center_b], axis=-1)
    for c in range(3):
        canvas[:, :, c] = (canvas[:, :, c] * (1 - alpha_center) + center_rgb[:, :, c] * alpha_center).astype(np.uint8)

    img = Image.fromarray(canvas, "RGBA")

    # Render the NDL Crown + "NDL" + "NERFED DEMONLIST" natively at 4x (1280x1280) with soft glow and zero crop seams!
    glow_layer = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow_layer)

    crown_pts = [(450, 540), (640, 638), (830, 540), (740, 696), (540, 696)]
    g_draw.polygon(crown_pts, fill=(0, 225, 255, 180))
    f_ndl_main = get_font("impact.ttf", 230)
    draw_text_centered(g_draw, 640, 835, "NDL", f_ndl_main, (255, 255, 255, 160), stroke_width=24, stroke_fill=(56, 189, 248, 120))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=22))
    img = Image.alpha_composite(img, glow_layer)

    # Crisp vector Cyan Crown with cyan->blue gradient
    crown_mask = Image.new("L", (W, W), 0)
    ImageDraw.Draw(crown_mask).polygon(crown_pts, fill=255)
    crown_grad = np.zeros((W, W, 4), dtype=np.uint8)
    tx = np.clip((xx - 450.0) / 380.0, 0.0, 1.0)
    crown_grad[:, :, 0] = (10 * (1 - tx) + 56 * tx).astype(np.uint8)
    crown_grad[:, :, 1] = (235 * (1 - tx) + 180 * tx).astype(np.uint8)
    crown_grad[:, :, 2] = 255
    crown_grad[:, :, 3] = np.array(crown_mask)
    img = Image.alpha_composite(img, Image.fromarray(crown_grad, "RGBA"))

    draw = ImageDraw.Draw(img)
    # Crisp "NDL" with dark navy stroke + white fill
    draw_text_centered(draw, 640, 835, "NDL", f_ndl_main, (255, 255, 255, 255), stroke_width=16, stroke_fill=(5, 14, 26, 255))

    # Crisp unclipped "NERFED DEMONLIST" in spaced cyan letters below NDL inside the circle
    f_ndl_sub = get_font("arialbd.ttf", 34)
    draw_text_centered(draw, int(cx), int(cy + 195), "N E R F E D   D E M O N L I S T", f_ndl_sub, (56, 189, 248, 255))
    f_title = get_font("arial.ttf", 104)
    f_sub = get_font("arial.ttf", 46)

    draw_text_centered(draw, 640, 120, "Things I have done since", f_title, (15, 15, 15, 255))
    draw_text_centered(draw, 640, 240, "NDL went down", f_title, (15, 15, 15, 255))

    draw_text_centered(draw, 210, 365, "(It's been 25", f_sub, (25, 25, 25, 255))
    draw_text_centered(draw, 210, 425, "minutes I think)", f_sub, (25, 25, 25, 255))

    save_sticker(img, "ndl_piechart_meme.png")


# ==============================================================================
# 2. CBF DETECTED MEME (Geometry Dash 2.2 Alert Popup)
# ==============================================================================
def make_cbf_detected_meme():
    W = 1280
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Outer drop shadow
    draw.rounded_rectangle([56, 136, 1224, 1144], radius=72, fill=(0, 0, 0, 180))
    # GD brown dialog box with golden-orange border
    draw.rounded_rectangle([40, 120, 1240, 1120], radius=72, fill=(66, 36, 18, 255), outline=(255, 195, 55, 255), width=20)
    # Inner dark inset panel
    draw.rounded_rectangle([76, 156, 1204, 1084], radius=52, fill=(38, 20, 10, 255), outline=(130, 78, 36, 255), width=8)

    f_title = get_font("impact.ttf", 136)
    f_body = get_font("arialbd.ttf", 76)
    f_loser = get_font("impact.ttf", 96)
    f_btn = get_font("impact.ttf", 104)

    # Header
    draw_text_centered(draw, 640, 275, "CBF DETECTED", f_title, (255, 215, 45, 255), stroke_width=14)
    # Body lines
    draw_text_centered(draw, 640, 445, "Click Between Frames", f_body, (255, 255, 255, 255), stroke_width=8)
    draw_text_centered(draw, 640, 545, "is ILLEGAL on NDL!", f_body, (56, 189, 248, 255), stroke_width=8)
    # Red punchline
    draw_text_centered(draw, 640, 695, "LOSER! SKILL ISSUE!", f_loser, (255, 75, 75, 255), stroke_width=10)

    # Classic GD glossy green OK button
    draw.rounded_rectangle([380, 815, 900, 1025], radius=48, fill=(34, 197, 94, 255), outline=(255, 255, 255, 255), width=14)
    draw.rounded_rectangle([404, 832, 876, 910], radius=28, fill=(134, 239, 172, 95))
    draw_text_centered(draw, 640, 920, "OK", f_btn, (255, 255, 255, 255), stroke_width=12)

    save_sticker(img, "cbf_detected_meme.png")


# ==============================================================================
# 3. WHERE ARE THE CLICKS?! (List Mods Audio Spectrogram Meme)
# ==============================================================================
def make_where_clicks_meme():
    W = 1280
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Card background
    draw.rounded_rectangle([32, 32, 1248, 1248], radius=96, fill=(11, 20, 38, 255), outline=(56, 189, 248, 255), width=16)

    f_top = get_font("impact.ttf", 88)
    f_db = get_font("arialbd.ttf", 52)
    f_bot = get_font("impact.ttf", 98)
    f_tag = get_font("arialbd.ttf", 58)

    draw_text_centered(draw, 640, 135, "LIST MODS REVIEWING", f_top, (255, 90, 90, 255), stroke_width=10)
    draw_text_centered(draw, 640, 235, "YOUR COMPLETION:", f_top, (255, 215, 50, 255), stroke_width=10)

    # Audio monitor screen
    draw.rounded_rectangle([88, 320, 1192, 740], radius=40, fill=(5, 10, 20, 255), outline=(50, 75, 110, 255), width=10)
    # Subtle grid lines inside monitor
    for gx in range(180, 1150, 120):
        draw.line([(gx, 330), (gx, 730)], fill=(18, 34, 56, 255), width=4)
    for gy in [425, 530, 635]:
        draw.line([(98, gy), (1182, gy)], fill=(18, 34, 56, 255), width=4)

    # Red flatline across center of monitor
    draw.line([(120, 560), (1160, 560)], fill=(239, 68, 68, 255), width=18)

    # Label positioned cleanly on the left side away from magnifying glass
    f_db_small = get_font("arialbd.ttf", 44)
    draw_text_centered(draw, 440, 410, "AUDIO: 0.0 dB (FLATLINE)", f_db_small, (248, 113, 113, 255), stroke_width=6)

    # Magnifying glass on the right side (handle drawn FIRST so ring covers joint seamlessly!)
    mg_cx, mg_cy, mg_r = 885, 555, 130
    hx0 = int(mg_cx + mg_r * 0.68)
    hy0 = int(mg_cy + mg_r * 0.68)
    draw.line([(hx0, hy0), (hx0 + 135, hy0 + 135)], fill=(120, 65, 20, 255), width=52)
    draw.line([(hx0, hy0), (hx0 + 135, hy0 + 135)], fill=(217, 119, 6, 255), width=36)
    # Dark cyan-tinted glass interior + zoomed red flatline visible right through the lens!
    draw.ellipse([mg_cx - mg_r, mg_cy - mg_r, mg_cx + mg_r, mg_cy + mg_r], fill=(12, 32, 58, 255))
    draw.line([(mg_cx - mg_r + 12, mg_cy), (mg_cx + mg_r - 12, mg_cy)], fill=(255, 75, 75, 255), width=28)
    # Outer yellow ring of magnifying glass
    draw.ellipse([mg_cx - mg_r, mg_cy - mg_r, mg_cx + mg_r, mg_cy + mg_r], outline=(250, 204, 21, 255), width=24)
    # Specular highlight arc on glass
    draw.arc([mg_cx - mg_r + 28, mg_cy - mg_r + 28, mg_cx + mg_r - 28, mg_cy + mg_r - 28], start=200, end=260, fill=(255, 255, 255, 210), width=12)

    # Bottom meme text
    draw_text_centered(draw, 640, 865, "WHERE ARE THE CLICKS?!", f_bot, (255, 255, 255, 255), stroke_width=12)

    # Bottom red pill
    draw.rounded_rectangle([140, 965, 1140, 1135], radius=48, fill=(185, 28, 28, 255), outline=(252, 165, 165, 255), width=10)
    draw_text_centered(draw, 640, 1050, "NO CLICKS  •  REJECTED", f_tag, (255, 255, 255, 255), stroke_width=6)

    save_sticker(img, "where_clicks_meme.png")


# ==============================================================================
# 4. SOURCE: TRUST ME BRO (Approved Record Meme - Zero Missing Glyphs!)
# ==============================================================================
def make_approved_trust_meme():
    W = 1280
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Emerald card background
    draw.rounded_rectangle([32, 32, 1248, 1248], radius=96, fill=(6, 46, 34, 255), outline=(52, 211, 153, 255), width=18)
    draw.rounded_rectangle([64, 64, 1216, 1216], radius=72, fill=(6, 62, 46, 255), outline=(16, 185, 129, 120), width=8)

    f_top = get_font("impact.ttf", 104)
    f_huge = get_font("impact.ttf", 148)
    f_mid = get_font("arialbd.ttf", 64)
    f_bot = get_font("impact.ttf", 86)

    draw_text_centered(draw, 640, 175, "SOURCE:", f_top, (250, 204, 21, 255), stroke_width=12)
    draw_text_centered(draw, 640, 345, "TRUST ME BRO", f_huge, (74, 222, 128, 255), stroke_width=14)

    # Middle banner with vector checkmark icon + text
    draw.rounded_rectangle([110, 480, 1170, 660], radius=44, fill=(4, 34, 25, 255), outline=(52, 211, 153, 255), width=10)
    # Vector green checkmark circle on left of middle banner
    draw.ellipse([155, 515, 265, 625], fill=(34, 197, 94, 255))
    draw.line([(182, 572), (204, 596), (242, 545)], fill=(255, 255, 255, 255), width=16, joint="curve")
    draw_text_centered(draw, 705, 570, "100% LEGIT NO NOCLIP", f_mid, (255, 255, 255, 255), stroke_width=6)

    # Bottom glowing green stamp box
    draw.rounded_rectangle([120, 740, 1160, 1110], radius=56, fill=(22, 163, 74, 255), outline=(255, 255, 255, 255), width=14)
    draw.rounded_rectangle([148, 764, 1132, 910], radius=36, fill=(74, 222, 128, 75))
    draw_text_centered(draw, 640, 860, "NDL LIST MODS:", f_bot, (254, 240, 138, 255), stroke_width=10)
    draw_text_centered(draw, 640, 1000, "\"I TRUST YOU BRO\"", f_bot, (255, 255, 255, 255), stroke_width=10)

    save_sticker(img, "approved_trust_meme.png")


# ==============================================================================
# 5. 98% ON AN EXTREME DEMON PAIN MEME
# ==============================================================================
def make_98_percent_pain_meme():
    W = 1280
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Crimson card background
    draw.rounded_rectangle([32, 32, 1248, 1248], radius=96, fill=(40, 8, 14, 255), outline=(248, 113, 113, 255), width=18)

    # Top GD Progress Bar showing 98%
    draw.rounded_rectangle([110, 105, 960, 185], radius=40, fill=(15, 5, 8, 255), outline=(255, 255, 255, 255), width=10)
    # 98% green fill
    draw.rounded_rectangle([122, 117, 932, 173], radius=28, fill=(74, 222, 128, 255))
    f_pct = get_font("impact.ttf", 92)
    draw_text_centered(draw, 1095, 145, "98%", f_pct, (255, 215, 50, 255), stroke_width=10)

    # Ground line at y=690
    draw.line([(90, 690), (1190, 690)], fill=(248, 113, 113, 255), width=12)

    # 3 Deadly Last Jump Spikes
    for sx in [150, 310, 470]:
        pts = [(sx, 686), (sx + 80, 410), (sx + 160, 686)]
        draw.polygon(pts, fill=(220, 38, 38, 255), outline=(255, 255, 255, 255), width=10)
        # Inner red core
        pts_in = [(sx + 30, 670), (sx + 80, 485), (sx + 130, 670)]
        draw.polygon(pts_in, fill=(127, 29, 29, 255))

    # GD Cube crashing right into the 3rd spike + explosion ring
    draw.ellipse([540, 390, 740, 590], fill=(251, 146, 60, 140), outline=(254, 240, 138, 255), width=10)
    cx0, cy0 = 670, 330
    draw.rounded_rectangle([cx0, cy0, cx0 + 360, cy0 + 350], radius=32, fill=(250, 204, 21, 255), outline=(255, 255, 255, 255), width=14)
    # Cyan crying waterfalls from eyes
    draw.rectangle([cx0 + 55, cy0 + 130, cx0 + 125, cy0 + 340], fill=(56, 189, 248, 255))
    draw.rectangle([cx0 + 235, cy0 + 130, cx0 + 305, cy0 + 340], fill=(56, 189, 248, 255))
    # Eyes
    draw.rectangle([cx0 + 50, cy0 + 70, cx0 + 135, cy0 + 145], fill=(15, 23, 42, 255), outline=(255, 255, 255, 255), width=6)
    draw.rectangle([cx0 + 225, cy0 + 70, cx0 + 310, cy0 + 145], fill=(15, 23, 42, 255), outline=(255, 255, 255, 255), width=6)
    # Screaming mouth
    draw.rounded_rectangle([cx0 + 100, cy0 + 185, cx0 + 260, cy0 + 310], radius=36, fill=(127, 29, 29, 255), outline=(15, 23, 42, 255), width=10)

    f_huge = get_font("impact.ttf", 122)
    f_bot = get_font("impact.ttf", 104)
    draw_text_centered(draw, 640, 845, "98% ON EXTREME", f_huge, (255, 255, 255, 255), stroke_width=14)
    draw_text_centered(draw, 640, 1035, "NEW BEST! (I CRIED)", f_bot, (252, 165, 165, 255), stroke_width=12)

    save_sticker(img, "98_percent_pain_meme.png")


# ==============================================================================
# 6. NDL APPROVED STAMP (4x Supersampled Shield + Vector Checkmark + Centered)
# ==============================================================================
def make_ndl_approved():
    W = 1280
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Outer cyan glow circle
    draw.ellipse([70, 50, 1210, 1090], fill=(6, 22, 46, 255), outline=(56, 189, 248, 255), width=28)
    draw.ellipse([115, 95, 1165, 1045], fill=(9, 30, 60, 255), outline=(14, 165, 233, 140), width=10)

    # NDL Cyan Crown at top
    crown_pts = [(390, 220), (640, 345), (890, 220), (775, 420), (505, 420)]
    draw.polygon(crown_pts, fill=(56, 189, 248, 255), outline=(186, 230, 253, 255), width=8)

    f_ndl = get_font("impact.ttf", 280)
    f_app = get_font("impact.ttf", 124)

    draw_text_centered(draw, 640, 625, "NDL", f_ndl, (255, 255, 255, 255), stroke_width=20)

    # Green APPROVED ribbon pill at bottom
    draw.rounded_rectangle([110, 850, 1170, 1150], radius=75, fill=(22, 163, 74, 255), outline=(255, 255, 255, 255), width=18)
    draw.rounded_rectangle([140, 874, 1140, 990], radius=45, fill=(134, 239, 172, 70))

    # Vector checkmark on left of APPROVED
    draw.line([(215, 1005), (265, 1055), (345, 950)], fill=(255, 255, 255, 255), width=28, joint="curve")
    draw_text_centered(draw, 695, 1000, "APPROVED", f_app, (255, 255, 255, 255), stroke_width=12)

    save_sticker(img, "ndl_approved.png")


# ==============================================================================
# 7. NERFED GG! GOLD STARBURST BADGE
# ==============================================================================
def make_nerfed_gg():
    W = 1280
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 12-point golden starburst polygon (nested polygons for razor-sharp points without outline notches)
    pts_outer = []
    pts_inner = []
    cx, cy = 640, 555
    for i in range(24):
        angle = i * math.pi / 12.0 - math.pi / 2.0
        r_out = 520 if i % 2 == 0 else 425
        r_in = 492 if i % 2 == 0 else 402
        pts_outer.append((cx + r_out * math.cos(angle), cy + r_out * math.sin(angle)))
        pts_inner.append((cx + r_in * math.cos(angle), cy + r_in * math.sin(angle)))
    draw.polygon(pts_outer, fill=(254, 240, 138, 255))
    draw.polygon(pts_inner, fill=(234, 179, 8, 255))

    # Inner dark gold medallion circle
    draw.ellipse([245, 165, 1035, 955], fill=(45, 22, 6, 255), outline=(250, 204, 21, 255), width=18)

    f_gg = get_font("impact.ttf", 330)
    f_sub = get_font("impact.ttf", 108)

    draw_text_centered(draw, 640, 540, "GG!", f_gg, (250, 204, 21, 255), stroke_width=24)

    # Bottom pill
    draw.rounded_rectangle([120, 910, 1160, 1170], radius=68, fill=(161, 98, 7, 255), outline=(254, 240, 138, 255), width=16)
    draw_text_centered(draw, 640, 1040, "100% VERIFIED", f_sub, (255, 255, 255, 255), stroke_width=12)

    save_sticker(img, "nerfed_gg.png")


# ==============================================================================
# 8. CBF READY / ALLOWED ON NDL BADGE (Fixed text overflow!)
# ==============================================================================
def make_cbf_ready():
    W = 1280
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Sleek purple/cyan hexagonal tech shield
    draw.rounded_rectangle([60, 80, 1220, 1180], radius=140, fill=(28, 12, 56, 255), outline=(192, 132, 252, 255), width=24)
    draw.rounded_rectangle([104, 124, 1176, 1136], radius=108, fill=(18, 8, 38, 255), outline=(56, 189, 248, 180), width=10)

    f_cbf = get_font("impact.ttf", 290)
    f_mid = get_font("arialbd.ttf", 64)
    f_bot = get_font("impact.ttf", 96)

    draw_text_centered(draw, 640, 410, "CBF", f_cbf, (56, 189, 248, 255), stroke_width=22)
    draw_text_centered(draw, 640, 685, "CLICK BETWEEN FRAMES", f_mid, (233, 213, 255, 255), stroke_width=8)

    # Bottom cyan/purple badge where text fits with plenty of padding!
    draw.rounded_rectangle([140, 815, 1140, 1065], radius=60, fill=(126, 34, 206, 255), outline=(255, 255, 255, 255), width=14)
    draw_text_centered(draw, 640, 940, "LEGAL & VERIFIED", f_bot, (255, 255, 255, 255), stroke_width=10)

    save_sticker(img, "cbf_ready.png")


if __name__ == "__main__":
    make_ndl_piechart_meme()
    make_cbf_detected_meme()
    make_where_clicks_meme()
    make_approved_trust_meme()
    make_98_percent_pain_meme()
    make_ndl_approved()
    make_nerfed_gg()
    make_cbf_ready()
    print("All 8 stickers regenerated at 4x supersampling!")
