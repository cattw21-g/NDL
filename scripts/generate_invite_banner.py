import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_invite_banner(output_path="public/server-invite-banner.png"):
    w, h = 1920, 1080
    print(f"[*] Generating {w}x{h} Custom Server Invite Banner...")
    
    # 1. Base gradient background
    y_coords, x_coords = np.mgrid[0:h, 0:w]
    # Radial glow from left-center (where logo sits: x=480, y=540)
    dist_logo = np.sqrt(((x_coords - 480) * 0.8)**2 + ((y_coords - 540) * 1.0)**2)
    radial_glow = np.exp(- (dist_logo / 600.0)**1.5)
    
    # Secondary ambient cyan glow from top right
    dist_tr = np.sqrt(((x_coords - 1600) * 0.9)**2 + ((y_coords - 200) * 1.1)**2)
    ambient_glow = np.exp(- (dist_tr / 500.0)**1.8)
    
    # Colors
    bg_r = 4 + 14 * radial_glow + 8 * ambient_glow
    bg_g = 7 + 38 * radial_glow + 26 * ambient_glow
    bg_b = 16 + 65 * radial_glow + 45 * ambient_glow
    
    bg_arr = np.clip(np.dstack([bg_r, bg_g, bg_b, np.full((h, w), 255)]), 0, 255).astype(np.uint8)
    img = Image.fromarray(bg_arr, mode="RGBA")
    
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    # 2. Draw subtle cyber grid
    grid_size = 64
    for gx in range(0, w, grid_size):
        draw.line([(gx, 0), (gx, h)], fill=(14, 116, 144, 28), width=1)
    for gy in range(0, h, grid_size):
        draw.line([(0, gy), (w, gy)], fill=(14, 116, 144, 28), width=1)
        
    # Diagonal high-tech accent rays
    draw.line([(0, 300), (w, 850)], fill=(6, 182, 212, 22), width=2)
    draw.line([(0, 450), (w, 1000)], fill=(6, 182, 212, 16), width=1)
    
    # 3. Add glowing particles / embers
    np.random.seed(99)
    for _ in range(85):
        px = np.random.uniform(50, w - 50)
        py = np.random.uniform(50, h - 50)
        p_size = np.random.uniform(2, 6)
        p_alpha = np.random.randint(60, 220)
        color = (56, 189, 248, p_alpha) if np.random.rand() > 0.3 else (250, 204, 21, p_alpha)
        # Soft glow around ember
        draw.ellipse([px - p_size * 2, py - p_size * 2, px + p_size * 2, py + p_size * 2], fill=(color[0], color[1], color[2], color[3] // 3))
        draw.ellipse([px - p_size, py - p_size, px + p_size, py + p_size], fill=color)

    # 4. Paste official NDL Logo on the left
    logo = Image.open('public/logo.png').convert('RGBA')
    logo_size = 460
    logo_resized = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    
    # Outer drop glow for the logo
    logo_pos_x = 160
    logo_pos_y = (h - logo_size) // 2
    
    # Large soft radial glow under the logo
    for r_glow in range(40, 0, -5):
        alpha = int(4 * (45 - r_glow))
        draw.ellipse(
            [logo_pos_x - r_glow, logo_pos_y - r_glow, logo_pos_x + logo_size + r_glow, logo_pos_y + logo_size + r_glow],
            fill=(6, 182, 212, min(alpha, 35))
        )
    
    # Composite overlay before pasting logo
    img = Image.alpha_composite(img, overlay)
    img.paste(logo_resized, (logo_pos_x, logo_pos_y), logo_resized)
    
    # 5. Right side content (Typography, Cards, Badges)
    draw_final = ImageDraw.Draw(img)
    
    content_x = 720
    
    # Pill Tag: [ OFFICIAL GEOMETRY DASH COMMUNITY ]
    tag_y = 230
    tag_text = "OFFICIAL GEOMETRY DASH COMMUNITY"
    pill_w = 410
    pill_h = 36
    draw_final.rounded_rectangle(
        [content_x, tag_y, content_x + pill_w, tag_y + pill_h],
        radius=18,
        fill=(6, 182, 212, 35),
        outline=(56, 189, 248, 160),
        width=1
    )
    # Tag dot & text
    draw_final.ellipse([content_x + 16, tag_y + 13, content_x + 26, tag_y + 23], fill=(56, 189, 248, 255))
    
    try:
        # Load system fonts if possible, else default
        font_tag = ImageFont.truetype("arialbd.ttf", 15)
        font_title = ImageFont.truetype("arialbd.ttf", 78)
        font_sub = ImageFont.truetype("arial.ttf", 26)
        font_card_title = ImageFont.truetype("arialbd.ttf", 20)
        font_card_desc = ImageFont.truetype("arial.ttf", 15)
        font_footer = ImageFont.truetype("arialbd.ttf", 20)
    except Exception:
        font_tag = ImageFont.load_default()
        font_title = font_tag
        font_sub = font_tag
        font_card_title = font_tag
        font_card_desc = font_tag
        font_footer = font_tag

    draw_final.text((content_x + 36, tag_y + 9), tag_text, fill=(224, 242, 254, 255), font=font_tag)
    
    # Giant Title: NERFED DEMONLIST
    title_y = 290
    # Drop shadow
    draw_final.text((content_x + 3, title_y + 3), "NERFED DEMONLIST", fill=(0, 0, 0, 220), font=font_title)
    draw_final.text((content_x, title_y), "NERFED DEMONLIST", fill=(255, 255, 255, 255), font=font_title)
    
    # Subtitle: THE COMPETITIVE HUB FOR APPROVED NERFED DEMON COMPLETIONS
    sub_y = title_y + 95
    draw_final.text(
        (content_x, sub_y),
        "The premier competitive leaderboard for reviewed & approved nerfed demon records.",
        fill=(148, 163, 184, 255),
        font=font_sub
    )
    
    # 3 Glass Feature Cards
    cards_y = sub_y + 70
    card_w = 340
    card_h = 135
    card_gap = 25
    
    cards_data = [
        ("🏆 Ranked Demonlist", "Approved level completions", "Real-time points & tier rankings"),
        ("⚡ Strict Verification", "Full click-audio inspection", "CBF & high-FPS rules enforcement"),
        ("🌐 Global Standings", "Country leaderboards & stats", "Community & staff voting system"),
    ]
    
    for i, (c_title, c_desc1, c_desc2) in enumerate(cards_data):
        cx = content_x + i * (card_w + card_gap)
        # Dark glass card background
        draw_final.rounded_rectangle(
            [cx, cards_y, cx + card_w, cards_y + card_h],
            radius=16,
            fill=(15, 23, 42, 190),
            outline=(51, 65, 85, 220),
            width=1
        )
        # Top cyan highlight line
        draw_final.line([(cx + 20, cards_y), (cx + 80, cards_y)], fill=(56, 189, 248, 220), width=2)
        
        # Card Text
        draw_final.text((cx + 18, cards_y + 18), c_title, fill=(255, 255, 255, 255), font=font_card_title)
        draw_final.text((cx + 18, cards_y + 58), c_desc1, fill=(148, 163, 184, 255), font=font_card_desc)
        draw_final.text((cx + 18, cards_y + 85), c_desc2, fill=(100, 116, 139, 255), font=font_card_desc)

    # Footer Links Bar
    footer_y = cards_y + card_h + 50
    draw_final.rounded_rectangle(
        [content_x, footer_y, content_x + 720, footer_y + 50],
        radius=12,
        fill=(8, 47, 73, 120),
        outline=(14, 116, 144, 180),
        width=1
    )
    draw_final.text(
        (content_x + 24, footer_y + 14),
        "🔗  Website: www.nerfeddemonlist.net   •   Discord: discord.gg/ndl",
        fill=(56, 189, 248, 255),
        font=font_footer
    )

    print(f"[SAVE] Saving Custom Server Invite Banner to {output_path}...")
    img.save(output_path, "PNG", optimize=True)
    print(f"[SUCCESS] Custom Server Invite Banner generated successfully at {output_path}!")

if __name__ == "__main__":
    create_invite_banner()
