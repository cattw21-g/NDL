import os
import math
from PIL import Image, ImageDraw, ImageFont

os.makedirs("public/stickers", exist_ok=True)

def generate_stickers():
    stickers = []
    
    # 1. NDL Approved
    im = Image.new("RGBA", (320, 320), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # Outer gold seal with scalloped edges
    cx, cy, r = 160, 160, 140
    # Starburst / seal polygon
    pts = []
    for a in range(0, 360, 10):
        rad = r if (a // 10) % 2 == 0 else r - 12
        pts.append((cx + rad * math.cos(math.radians(a)), cy + rad * math.sin(math.radians(a))))
    d.polygon(pts, fill=(234, 179, 8, 255), outline=(254, 240, 138, 255), width=4)
    # Inner dark disc
    d.ellipse([cx - 105, cy - 105, cx + 105, cy + 105], fill=(15, 23, 42, 255), outline=(250, 204, 21, 255), width=3)
    # Text & Checkmark
    font_bold = ImageFont.truetype("arialbd.ttf", 26)
    font_sub = ImageFont.truetype("arialbd.ttf", 20)
    d.text((cx - 30, cy - 82), "NDL", fill=(56, 189, 248, 255), font=font_bold)
    # Large green checkmark
    d.line([(cx - 48, cy), (cx - 12, cy + 34), (cx + 52, cy - 28)], fill=(34, 197, 94, 255), width=18, joint="curve")
    d.line([(cx - 48, cy), (cx - 12, cy + 34), (cx + 52, cy - 28)], fill=(255, 255, 255, 255), width=8, joint="curve")
    d.text((cx - 62, cy + 50), "APPROVED", fill=(250, 204, 21, 255), font=font_sub)
    
    p1 = "public/stickers/ndl_approved.png"
    im.save(p1)
    stickers.append({"name": "NDL Approved", "desc": "Official NDL record approval stamp", "tags": "approved, verified, ndl", "path": p1})

    # 2. Nerfed GG
    im2 = Image.new("RGBA", (320, 320), (0, 0, 0, 0))
    d2 = ImageDraw.Draw(im2)
    d2.rounded_rectangle([20, 40, 300, 280], radius=32, fill=(16, 185, 129, 240), outline=(52, 211, 153, 255), width=6)
    font_gg = ImageFont.truetype("arialbd.ttf", 100)
    font_nerf = ImageFont.truetype("arialbd.ttf", 28)
    d2.text((70, 75), "GG!", fill=(255, 255, 255, 255), font=font_gg)
    d2.rounded_rectangle([50, 205, 270, 252], radius=16, fill=(6, 78, 59, 230), outline=(110, 231, 183, 255), width=2)
    d2.text((68, 213), "NERFED LIST", fill=(110, 231, 183, 255), font=font_nerf)
    p2 = "public/stickers/nerfed_gg.png"
    im2.save(p2)
    stickers.append({"name": "Nerfed GG", "desc": "GG completion celebration for nerfed demons", "tags": "gg, win, completion", "path": p2})

    # 3. CBF Ready
    im3 = Image.new("RGBA", (320, 320), (0, 0, 0, 0))
    d3 = ImageDraw.Draw(im3)
    d3.rounded_rectangle([25, 55, 295, 265], radius=36, fill=(15, 23, 42, 245), outline=(56, 189, 248, 255), width=6)
    font_cbf = ImageFont.truetype("arialbd.ttf", 74)
    font_cbf_sub = ImageFont.truetype("arialbd.ttf", 26)
    d3.text((64, 85), "CBF", fill=(56, 189, 248, 255), font=font_cbf)
    d3.rounded_rectangle([45, 185, 275, 235], radius=14, fill=(8, 47, 73, 220), outline=(14, 165, 233, 255), width=2)
    d3.text((72, 195), "LEGAL & VERIFIED", fill=(224, 242, 254, 255), font=font_cbf_sub)
    p3 = "public/stickers/cbf_ready.png"
    im3.save(p3)
    stickers.append({"name": "CBF Verified", "desc": "Click Between Frames legal completion badge", "tags": "cbf, mod, legal", "path": p3})

    print(f"[*] Generated {len(stickers)} stickers in public/stickers/")
    return stickers

if __name__ == "__main__":
    generate_stickers()
