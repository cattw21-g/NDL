import os
import math
from PIL import Image, ImageDraw, ImageFont

os.makedirs("public/stickers", exist_ok=True)

def generate_all_hilarious_stickers():
    try:
        font_large = ImageFont.truetype("arialbd.ttf", 28)
        font_med = ImageFont.truetype("arialbd.ttf", 20)
        font_small = ImageFont.truetype("arial.ttf", 15)
        font_meme = ImageFont.truetype("impact.ttf", 36) if os.path.exists("C:/Windows/Fonts/impact.ttf") else font_large
    except Exception:
        font_large = font_med = font_small = font_meme = ImageFont.load_default()

    # Sticker 1: CBF DETECTED, LOSER! (Iconic Geode / GD 2.2 popup dialog)
    im1 = Image.new("RGBA", (320, 320), (0, 0, 0, 0))
    d1 = ImageDraw.Draw(im1)
    # Windows/GD dialog box
    d1.rounded_rectangle([15, 35, 305, 285], radius=16, fill=(15, 23, 42, 255), outline=(239, 68, 68, 255), width=4)
    # Header red bar
    d1.rounded_rectangle([15, 35, 305, 80], radius=16, fill=(185, 28, 28, 255))
    d1.rectangle([15, 60, 305, 80], fill=(185, 28, 28, 255))
    d1.text((160, 56), "CBF DETECTED, LOSER!", fill=(255, 255, 255, 255), font=font_med, anchor="mm")
    
    # Body text
    d1.text((160, 120), "Click Between Frames", fill=(254, 202, 202, 255), font=font_med, anchor="mm")
    d1.text((160, 150), "was detected during your run.", fill=(226, 232, 240, 255), font=font_small, anchor="mm")
    d1.text((160, 175), "Your completion is now ILLEGAL.", fill=(248, 113, 113, 255), font=font_small, anchor="mm")
    
    # Buttons
    d1.rounded_rectangle([35, 215, 155, 260], radius=10, fill=(30, 41, 59, 255), outline=(71, 85, 105, 255), width=2)
    d1.text((95, 237), "Rage Quit", fill=(226, 232, 240, 255), font=font_small, anchor="mm")
    d1.rounded_rectangle([165, 215, 285, 260], radius=10, fill=(220, 38, 38, 255))
    d1.text((225, 237), "Blame RobTop", fill=(255, 255, 255, 255), font=font_small, anchor="mm")
    im1.save("public/stickers/cbf_detected_meme.png")

    # Sticker 2: "Where click audio?" (List reviewer magnifying glass meme)
    im2 = Image.new("RGBA", (320, 320), (0, 0, 0, 0))
    d2 = ImageDraw.Draw(im2)
    d2.rounded_rectangle([20, 25, 300, 295], radius=24, fill=(15, 23, 42, 250), outline=(56, 189, 248, 255), width=4)
    d2.text((160, 60), "WHERE CLICK AUDIO?", fill=(56, 189, 248, 255), font=font_med, anchor="mm")
    
    # Draw huge magnifying glass in center
    cx, cy = 160, 155
    mg_r = 52
    d2.ellipse([cx - mg_r, cy - mg_r, cx + mg_r, cy + mg_r], outline=(250, 204, 21, 255), width=8, fill=(8, 47, 73, 220))
    # Glass handle
    d2.line([(cx + 38, cy + 38), (cx + 80, cy + 80)], fill=(202, 138, 4, 255), width=14)
    # Tiny flat flatline waveform inside magnifying glass (zero clicks!)
    d2.line([(cx - 38, cy), (cx + 38, cy)], fill=(239, 68, 68, 255), width=3)
    d2.text((cx, cy + 18), "(flatline = rejected)", fill=(248, 113, 113, 255), font=font_small, anchor="mm")
    
    # Bottom stamp
    d2.rounded_rectangle([50, 240, 270, 278], radius=8, fill=(185, 28, 28, 240))
    d2.text((160, 259), "NO CLICKS • REJECTED", fill=(255, 255, 255, 255), font=font_small, anchor="mm")
    im2.save("public/stickers/where_clicks_meme.png")

    # Sticker 3: "Approved (Did not watch video)"
    im3 = Image.new("RGBA", (320, 320), (0, 0, 0, 0))
    d3 = ImageDraw.Draw(im3)
    # Diagonal tilted rubber stamp look
    d3.rounded_rectangle([20, 35, 300, 285], radius=20, fill=(6, 78, 59, 245), outline=(52, 211, 153, 255), width=5)
    d3.text((160, 80), "APPROVED", fill=(255, 255, 255, 255), font=font_meme, anchor="mm")
    d3.text((160, 135), "(I DID NOT WATCH", fill=(110, 231, 183, 255), font=font_med, anchor="mm")
    d3.text((160, 168), "THE PROOF VIDEO)", fill=(110, 231, 183, 255), font=font_med, anchor="mm")
    d3.text((160, 215), "I trust you bro 👍", fill=(254, 240, 138, 255), font=font_med, anchor="mm")
    d3.text((160, 255), "— NDL List Moderator", fill=(148, 163, 184, 255), font=font_small, anchor="mm")
    im3.save("public/stickers/approved_trust_meme.png")

    # Sticker 4: "98% on Bloodbath Nerfed" Pain meme
    im4 = Image.new("RGBA", (320, 320), (0, 0, 0, 0))
    d4 = ImageDraw.Draw(im4)
    d4.rounded_rectangle([20, 30, 300, 290], radius=22, fill=(69, 10, 10, 250), outline=(239, 68, 68, 255), width=4)
    d4.text((160, 65), "98% DEATH", fill=(254, 202, 202, 255), font=font_meme, anchor="mm")
    # Screaming cube face
    cube_x, cube_y, c_size = 160, 160, 80
    d4.rectangle([cube_x - c_size//2, cube_y - c_size//2, cube_x + c_size//2, cube_y + c_size//2], fill=(234, 179, 8, 255), outline=(15, 23, 42, 255), width=5)
    # Crying X eyes
    d4.text((cube_x - 22, cube_y - 25), "X", fill=(185, 28, 28, 255), font=font_large)
    d4.text((cube_x + 6, cube_y - 25), "X", fill=(185, 28, 28, 255), font=font_large)
    # Screaming wide open mouth
    d4.ellipse([cube_x - 18, cube_y + 6, cube_x + 18, cube_y + 32], fill=(15, 23, 42, 255))
    # Bottom text
    d4.text((160, 235), "IT WAS SUPPOSED TO BE NERFED", fill=(254, 240, 138, 255), font=font_small, anchor="mm")
    d4.text((160, 262), "*desks slammed*", fill=(248, 113, 113, 255), font=font_small, anchor="mm")
    im4.save("public/stickers/98_percent_pain_meme.png")

    print("[*] Generated 4 hilarious community meme stickers successfully!")

if __name__ == "__main__":
    generate_all_hilarious_stickers()
