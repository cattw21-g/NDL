import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

os.makedirs("public/emojis", exist_ok=True)

def draw_glow_circle(draw, cx, cy, r, color, glow_r=8):
    for i in range(glow_r, 0, -2):
        alpha = int(color[3] * (1.0 - i / glow_r) * 0.4)
        draw.ellipse([cx - r - i, cy - r - i, cx + r + i, cy + r + i], fill=(color[0], color[1], color[2], alpha))
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)

def generate_all_emojis():
    emojis = {}
    
    # 1. ndl_verified
    im = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # Hexagon
    cx, cy, r = 64, 64, 52
    hex_pts = [(cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a))) for a in range(30, 390, 60)]
    d.polygon(hex_pts, fill=(6, 182, 212, 230), outline=(56, 189, 248, 255), width=4)
    # Inner gold checkmark
    d.line([(42, 66), (56, 82), (88, 48)], fill=(250, 204, 21, 255), width=10, joint="curve")
    d.line([(42, 66), (56, 82), (88, 48)], fill=(255, 255, 255, 255), width=4, joint="curve")
    im.save("public/emojis/ndl_verified.png")
    emojis["ndl_verified"] = "public/emojis/ndl_verified.png"

    # 2. ndl_cbf
    im = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([10, 36, 118, 92], radius=16, fill=(15, 23, 42, 240), outline=(56, 189, 248, 255), width=4)
    d.text((24, 46), "CBF", fill=(56, 189, 248, 255), font=ImageFont.truetype("arialbd.ttf", 36))
    im.save("public/emojis/ndl_cbf.png")
    emojis["ndl_cbf"] = "public/emojis/ndl_cbf.png"

    # 3. ndl_gg
    im = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([12, 28, 116, 100], radius=18, fill=(16, 185, 129, 230), outline=(52, 211, 153, 255), width=4)
    d.text((32, 40), "GG", fill=(255, 255, 255, 255), font=ImageFont.truetype("arialbd.ttf", 46))
    im.save("public/emojis/ndl_gg.png")
    emojis["ndl_gg"] = "public/emojis/ndl_gg.png"

    # 4. ndl_100
    im = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([14, 14, 114, 114], fill=(234, 179, 8, 235), outline=(254, 240, 138, 255), width=4)
    d.text((22, 48), "100%", fill=(15, 23, 42, 255), font=ImageFont.truetype("arialbd.ttf", 32))
    im.save("public/emojis/ndl_100.png")
    emojis["ndl_100"] = "public/emojis/ndl_100.png"

    # 5. ndl_crown
    im = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    crown_pts = [(20, 92), (108, 92), (114, 42), (86, 68), (64, 26), (42, 68), (14, 42)]
    d.polygon(crown_pts, fill=(250, 204, 21, 245), outline=(202, 138, 4, 255), width=4)
    # Jewels
    for jx in [20, 64, 108]:
        d.ellipse([jx - 6, 92 - 6, jx + 6, 92 + 6], fill=(239, 68, 68, 255))
    im.save("public/emojis/ndl_crown.png")
    emojis["ndl_crown"] = "public/emojis/ndl_crown.png"

    # 6. ndl_extreme_demon
    im = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # Extreme Demon face: Red circle with horns
    # Horns
    d.polygon([(26, 48), (12, 14), (54, 34)], fill=(185, 28, 28, 255), outline=(239, 68, 68, 255), width=2)
    d.polygon([(102, 48), (116, 14), (74, 34)], fill=(185, 28, 28, 255), outline=(239, 68, 68, 255), width=2)
    # Head
    d.ellipse([22, 28, 106, 112], fill=(220, 38, 38, 255), outline=(153, 27, 27, 255), width=4)
    # Angry eyes
    d.polygon([(36, 56), (56, 68), (38, 72)], fill=(255, 255, 255, 255))
    d.polygon([(92, 56), (72, 68), (90, 72)], fill=(255, 255, 255, 255))
    # Teeth / grimace
    d.polygon([(46, 88), (64, 78), (82, 88), (74, 98), (54, 98)], fill=(15, 23, 42, 255))
    d.polygon([(52, 88), (58, 96), (64, 88)], fill=(255, 255, 255, 255))
    d.polygon([(64, 88), (70, 96), (76, 88)], fill=(255, 255, 255, 255))
    im.save("public/emojis/ndl_extreme.png")
    emojis["ndl_extreme"] = "public/emojis/ndl_extreme.png"

    # 7. fire_in_the_hole
    im = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # Normal face (green circle, smile, big pupils)
    d.ellipse([16, 16, 112, 112], fill=(34, 197, 94, 255), outline=(22, 163, 74, 255), width=4)
    # Eyes
    d.ellipse([34, 42, 56, 68], fill=(255, 255, 255, 255))
    d.ellipse([72, 42, 94, 68], fill=(255, 255, 255, 255))
    d.ellipse([42, 50, 52, 62], fill=(15, 23, 42, 255))
    d.ellipse([80, 50, 90, 62], fill=(15, 23, 42, 255))
    # Wide smile
    d.arc([38, 62, 90, 96], start=0, end=180, fill=(15, 23, 42, 255), width=6)
    im.save("public/emojis/fire_in_the_hole.png")
    emojis["fire_in_the_hole"] = "public/emojis/fire_in_the_hole.png"

    # 8. ndl_coin
    im = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([20, 20, 108, 108], fill=(202, 138, 4, 255), outline=(250, 204, 21, 255), width=5)
    d.ellipse([34, 34, 94, 94], fill=(234, 179, 8, 255), outline=(161, 98, 7, 255), width=3)
    # Star inside coin
    d.text((46, 36), "★", fill=(255, 255, 255, 255), font=ImageFont.truetype("arialbd.ttf", 46))
    im.save("public/emojis/ndl_coin.png")
    emojis["ndl_coin"] = "public/emojis/ndl_coin.png"

    # 9. ndl_demon_key
    im = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # Skeleton Key
    d.ellipse([24, 24, 64, 64], fill=(234, 179, 8, 255), outline=(250, 204, 21, 255), width=4)
    d.ellipse([36, 36, 52, 52], fill=(0, 0, 0, 0))
    d.line([(58, 52), (108, 102)], fill=(250, 204, 21, 255), width=8)
    d.line([(96, 90), (108, 78)], fill=(250, 204, 21, 255), width=6)
    d.line([(86, 100), (98, 88)], fill=(250, 204, 21, 255), width=6)
    im.save("public/emojis/ndl_demon_key.png")
    emojis["ndl_demon_key"] = "public/emojis/ndl_demon_key.png"

    # 10. ndl_star
    im = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.text((22, 18), "⭐", fill=(250, 204, 21, 255), font=ImageFont.truetype("seguiemj.ttf", 78) if os.path.exists("C:/Windows/Fonts/seguiemj.ttf") else ImageFont.truetype("arialbd.ttf", 64))
    im.save("public/emojis/ndl_star.png")
    emojis["ndl_star"] = "public/emojis/ndl_star.png"

    print(f"[*] Generated {len(emojis)} custom emojis in public/emojis/")
    return emojis

if __name__ == "__main__":
    generate_all_emojis()
