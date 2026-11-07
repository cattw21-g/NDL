import os
import math
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = "public/emojis"
os.makedirs(OUT_DIR, exist_ok=True)

def get_font(name, size):
    font_dir = r"C:\Windows\Fonts"
    for c in [name, "impact.ttf", "arialbd.ttf"]:
        p = os.path.join(font_dir, c)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def star_polygon(cx, cy, r_out, r_in, points=5):
    pts = []
    for i in range(points * 2):
        angle = i * math.pi / points - math.pi / 2.0
        r = r_out if i % 2 == 0 else r_in
        pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    return pts

def save_emoji(img_512, name):
    final = img_512.resize((128, 128), Image.Resampling.LANCZOS)
    path = os.path.join(OUT_DIR, f"{name}.png")
    final.save(path, "PNG", optimize=True)
    print(f"Saved emoji {name}.png")

# 1. NDL Crown
def make_ndl_crown():
    W = 512
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse([24, 24, 488, 488], fill=(8, 25, 48, 255), outline=(56, 189, 248, 255), width=24)
    pts_outer = [(82, 148), (256, 256), (430, 148), (348, 365), (164, 365)]
    pts_inner = [(106, 174), (256, 272), (406, 174), (336, 348), (176, 348)]
    draw.polygon(pts_outer, fill=(224, 242, 254, 255))
    draw.polygon(pts_inner, fill=(0, 225, 255, 255))
    save_emoji(img, "ndl_crown")

# 2. NDL #1 Badge
def make_ndl_top1():
    W = 512
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    pts_out = star_polygon(256, 256, 240, 195, points=12)
    pts_in = star_polygon(256, 256, 224, 180, points=12)
    draw.polygon(pts_out, fill=(254, 240, 138, 255))
    draw.polygon(pts_in, fill=(234, 179, 8, 255))
    draw.ellipse([86, 86, 426, 426], fill=(55, 28, 6, 255), outline=(250, 204, 21, 255), width=16)
    f = get_font("impact.ttf", 215)
    draw.text((256, 256), "#1", font=f, fill=(250, 204, 21, 255), anchor="mm", stroke_width=16, stroke_fill=(0, 0, 0, 255))
    save_emoji(img, "ndl_top1")

# 3. NDL Extreme Demon Face
def make_ndl_extreme():
    W = 512
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Curved horns (nested polygons for smooth edges)
    draw.polygon([(85, 190), (20, 40), (185, 120)], fill=(255, 255, 255, 255))
    draw.polygon([(95, 182), (42, 62), (175, 125)], fill=(185, 28, 28, 255))
    draw.polygon([(427, 190), (492, 40), (327, 120)], fill=(255, 255, 255, 255))
    draw.polygon([(417, 182), (470, 62), (337, 125)], fill=(185, 28, 28, 255))
    # Head
    draw.ellipse([64, 96, 448, 464], fill=(220, 38, 38, 255), outline=(255, 255, 255, 255), width=18)
    # Angry eyes
    draw.polygon([(115, 205), (225, 250), (130, 275)], fill=(250, 204, 21, 255), outline=(40, 5, 5, 255), width=10)
    draw.polygon([(397, 205), (287, 250), (382, 275)], fill=(250, 204, 21, 255), outline=(40, 5, 5, 255), width=10)
    # Fanged mouth
    draw.rounded_rectangle([135, 320, 377, 410], radius=32, fill=(45, 6, 6, 255), outline=(255, 255, 255, 255), width=10)
    for fx in [165, 235, 305]:
        draw.polygon([(fx, 326), (fx + 22, 375), (fx + 44, 326)], fill=(255, 255, 255, 255))
    save_emoji(img, "ndl_extreme")

# 4. NDL Verified Checkmark
def make_ndl_verified():
    W = 512
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([36, 36, 476, 476], radius=110, fill=(21, 128, 61, 255), outline=(134, 239, 172, 255), width=24)
    draw.rounded_rectangle([66, 66, 446, 250], radius=75, fill=(34, 197, 94, 255))
    draw.line([(135, 270), (220, 355), (382, 168)], fill=(6, 78, 59, 255), width=68, joint="curve")
    draw.line([(135, 270), (220, 355), (382, 168)], fill=(255, 255, 255, 255), width=48, joint="curve")
    save_emoji(img, "ndl_verified")

# 5. NDL CBF
def make_ndl_cbf():
    W = 512
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([24, 64, 488, 448], radius=84, fill=(46, 16, 101, 255), outline=(192, 132, 252, 255), width=24)
    f = get_font("impact.ttf", 220)
    draw.text((256, 256), "CBF", font=f, fill=(56, 189, 248, 255), anchor="mm", stroke_width=16, stroke_fill=(0, 0, 0, 255))
    save_emoji(img, "ndl_cbf")

# 6. NDL GG
def make_ndl_gg():
    W = 512
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse([24, 24, 488, 488], fill=(161, 98, 7, 255), outline=(253, 224, 71, 255), width=24)
    f = get_font("impact.ttf", 240)
    draw.text((256, 256), "GG", font=f, fill=(254, 240, 138, 255), anchor="mm", stroke_width=18, stroke_fill=(0, 0, 0, 255))
    save_emoji(img, "ndl_gg")

# 7. NDL 100%
def make_ndl_100():
    W = 512
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([16, 80, 496, 432], radius=80, fill=(8, 47, 73, 255), outline=(56, 189, 248, 255), width=22)
    f = get_font("impact.ttf", 185)
    draw.text((256, 256), "100%", font=f, fill=(250, 204, 21, 255), anchor="mm", stroke_width=16, stroke_fill=(0, 0, 0, 255))
    save_emoji(img, "ndl_100")

# 8. NDL Coin (Pure mathematical vector star in center - ZERO missing font glyphs!)
def make_ndl_coin():
    W = 512
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse([28, 28, 484, 484], fill=(234, 179, 8, 255), outline=(254, 240, 138, 255), width=24)
    draw.ellipse([76, 76, 436, 436], fill=(161, 98, 7, 255), outline=(250, 204, 21, 255), width=14)
    # Vector 5-point star in center
    pts_out = star_polygon(256, 256, 135, 58, points=5)
    pts_in = star_polygon(256, 256, 115, 48, points=5)
    draw.polygon(pts_out, fill=(255, 255, 255, 255))
    draw.polygon(pts_in, fill=(254, 240, 138, 255))
    save_emoji(img, "ndl_coin")

if __name__ == "__main__":
    make_ndl_crown()
    make_ndl_top1()
    make_ndl_extreme()
    make_ndl_verified()
    make_ndl_cbf()
    make_ndl_gg()
    make_ndl_100()
    make_ndl_coin()
    print("All emojis regenerated!")
