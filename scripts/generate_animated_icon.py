import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ART_DIR = r"C:\Users\cat97\.gemini\antigravity\brain\02297bf2-b1c1-4fa2-927a-5961238d30fc"

def get_font(name, size):
    font_dir = r"C:\Windows\Fonts"
    for c in [name, "impact.ttf", "arialbd.ttf"]:
        p = os.path.join(font_dir, c)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def generate_animated_icon():
    # Render at 512x512 with clean vector layers so there is ZERO background gradient banding in GIF!
    W = 512
    num_frames = 30
    frames = []

    yy, xx = np.mgrid[0:W, 0:W].astype(np.float32)
    cx, cy = 256.0, 256.0

    # Precompute rounded-square perimeter distance for the outer frame (x in 46..466, y in 46..466, radius=76)
    # Using signed distance to a rounded box centered at (256, 256) with half-size b=(210, 210) and corner radius r=76
    bx, by, br = 208.0, 208.0, 76.0
    qx = np.abs(xx - cx) - (bx - br)
    qy = np.abs(yy - cy) - (by - br)
    sd_box = np.sqrt(np.maximum(qx, 0.0) ** 2 + np.maximum(qy, 0.0) ** 2) + np.minimum(np.maximum(qx, qy), 0.0) - br

    # Border mask (thickness ~ 10px around sd_box == 0)
    border_base = np.clip(1.0 - np.abs(sd_box) / 5.5, 0.0, 1.0)
    border_glow_mask = np.exp(-(sd_box ** 2) / (2.0 * 14.0 ** 2))
    inside_box = np.clip(0.5 - sd_box / 2.0, 0.0, 1.0)

    # Angle around center for orbiting comet
    angle_map = np.arctan2(yy - cy, xx - cx)  # -pi .. pi

    # Pre-render static crisp Crown + NDL + NERFED DEMONLIST at 4x (2048x2048 -> 512x512)
    S = 2048
    emblem_4x = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    edraw = ImageDraw.Draw(emblem_4x)

    # Crown polygon at 4x
    crown_pts = [(500, 460), (1024, 730), (1548, 460), (1300, 880), (748, 880)]
    crown_mask_4x = Image.new("L", (S, S), 0)
    ImageDraw.Draw(crown_mask_4x).polygon(crown_pts, fill=255)
    crown_mask_512 = np.array(crown_mask_4x.resize((W, W), Image.Resampling.LANCZOS)).astype(np.float32) / 255.0

    # NDL main text at 4x
    f_ndl = get_font("impact.ttf", 610)
    edraw.text((1024, 1175), "NDL", font=f_ndl, fill=(255, 255, 255, 255), anchor="mm", stroke_width=40, stroke_fill=(4, 12, 24, 255))

    # NERFED DEMONLIST subtitle at 4x
    f_sub = get_font("arialbd.ttf", 86)
    edraw.text((1024, 1555), "N E R F E D   D E M O N L I S T", font=f_sub, fill=(56, 189, 248, 255), anchor="mm")

    emblem_512 = emblem_4x.resize((W, W), Image.Resampling.LANCZOS)
    emblem_arr = np.array(emblem_512).astype(np.float32)

    # Safe margin sparkles (strictly outside the center text/crown area!)
    sparkles = [
        (88, 130, 0.0),
        (424, 140, 0.35),
        (82, 290, 0.65),
        (430, 285, 0.15),
        (140, 102, 0.50),
        (372, 105, 0.82),
    ]

    for f_idx in range(num_frames):
        t = f_idx / float(num_frames)
        theta = t * 2.0 * math.pi

        # 1. Clean solid deep navy background (#071526) -> zero gradient banding in GIF!
        canvas = np.zeros((W, W, 3), dtype=np.float32)
        canvas[:, :, 0] = 7.0
        canvas[:, :, 1] = 21.0
        canvas[:, :, 2] = 38.0

        # 2. Breathing cyan aura right behind the Crown & NDL
        pulse = 0.5 + 0.5 * math.sin(theta)
        aura_dist = np.sqrt((xx - 256.0) ** 2 + ((yy - 235.0) * 1.15) ** 2)
        aura = np.exp(-(aura_dist ** 2) / (2.0 * (95.0 + 12.0 * pulse) ** 2)) * (0.28 + 0.12 * pulse)
        canvas[:, :, 0] += aura * 0.0
        canvas[:, :, 1] += aura * 190.0
        canvas[:, :, 2] += aura * 255.0

        # 3. Dual orbiting neon comets along the outer rounded-square border
        # Comet 1 (Cyan-White) at theta, Comet 2 (Electric Sky Blue) at theta + pi
        d_ang1 = np.angle(np.exp(1j * (angle_map - theta)))
        d_ang2 = np.angle(np.exp(1j * (angle_map - (theta + math.pi))))
        comet1 = np.exp(-(d_ang1 ** 2) / (2.0 * 0.42 ** 2))
        comet2 = np.exp(-(d_ang2 ** 2) / (2.0 * 0.42 ** 2))
        comet_total = np.clip(0.35 + 0.85 * (comet1 + comet2), 0.0, 1.3)

        # Soft border glow + crisp border core
        b_glow = border_glow_mask * (0.35 + 0.65 * (comet1 + comet2))
        canvas[:, :, 0] += b_glow * 20.0 + border_base * (40.0 + 180.0 * (comet1 + comet2))
        canvas[:, :, 1] += b_glow * 185.0 + border_base * (195.0 + 60.0 * (comet1 + comet2))
        canvas[:, :, 2] += b_glow * 255.0 + border_base * 255.0

        # 4. Composite Crown with animated diagonal light shimmer
        tx = np.clip((xx - 125.0) / 262.0, 0.0, 1.0)
        shimmer_pos = -0.4 + 1.8 * t
        shimmer = np.exp(-((tx + (yy - 115.0) / 300.0 - shimmer_pos * 1.6) ** 2) / (2.0 * 0.14 ** 2))
        c_r = 10.0 * (1.0 - tx) + 45.0 * tx + shimmer * 190.0
        c_g = 235.0 * (1.0 - tx) + 175.0 * tx + shimmer * 55.0
        c_b = 255.0
        canvas[:, :, 0] = canvas[:, :, 0] * (1.0 - crown_mask_512) + np.clip(c_r, 0, 255) * crown_mask_512
        canvas[:, :, 1] = canvas[:, :, 1] * (1.0 - crown_mask_512) + np.clip(c_g, 0, 255) * crown_mask_512
        canvas[:, :, 2] = canvas[:, :, 2] * (1.0 - crown_mask_512) + np.clip(c_b, 0, 255) * crown_mask_512

        # 5. Composite crisp NDL + NERFED DEMONLIST text + diagonal sheen on white NDL letters
        em_a = emblem_arr[:, :, 3:4] / 255.0
        em_rgb = emblem_arr[:, :, :3].copy()
        # Subtle cyan-gold shimmer across white NDL letters
        is_white = (em_rgb[:, :, 0] > 220) & (em_rgb[:, :, 1] > 220)
        em_rgb[:, :, 0] = np.where(is_white, np.clip(255.0 - shimmer * 60.0, 195, 255), em_rgb[:, :, 0])
        em_rgb[:, :, 1] = np.where(is_white, np.clip(255.0 - shimmer * 10.0, 240, 255), em_rgb[:, :, 1])
        canvas = canvas * (1.0 - em_a) + em_rgb * em_a

        # 6. Twinkling 4-point star sparkles in the safe side margins
        for sx, sy, phase in sparkles:
            sp_age = (t + phase) % 1.0
            sp_intensity = math.sin(sp_age * math.pi) ** 2
            if sp_intensity > 0.05:
                dx_s = np.abs(xx - sx)
                dy_s = np.abs(yy - sy)
                star_val = np.exp(-(dx_s ** 2 + dy_s ** 2) / (2.0 * 3.2 ** 2))
                star_val += np.exp(-(dx_s ** 2) / 1.5 - (dy_s ** 2) / (2.0 * (9.0 * sp_intensity) ** 2))
                star_val += np.exp(-(dy_s ** 2) / 1.5 - (dx_s ** 2) / (2.0 * (9.0 * sp_intensity) ** 2))
                star_val = np.clip(star_val * sp_intensity, 0.0, 1.0)
                canvas[:, :, 0] += star_val * 180.0
                canvas[:, :, 1] += star_val * 240.0
                canvas[:, :, 2] += star_val * 255.0

        # Mask outside rounded square cleanly to deep dark navy (#040c17)
        canvas = canvas * inside_box[:, :, None] + np.array([4.0, 12.0, 23.0])[None, None, :] * (1.0 - inside_box[:, :, None])

        frame_rgb = Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8), "RGB")
        if f_idx == 0:
            frame_rgb.save(os.path.join(ART_DIR, "icon_frame_0_preview.png"))
        # Quantize using MEDIANCUT with Floyd-Steinberg dithering so gradients are 100% smooth with zero stepping!
        frame_p = frame_rgb.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
        frames.append(frame_p)

    out_gif = "public/server-icon-animated.gif"
    art_gif = os.path.join(ART_DIR, "server-icon-animated.gif")
    frames[0].save(
        out_gif,
        save_all=True,
        append_images=frames[1:],
        duration=50,
        loop=0,
        optimize=False,
    )
    frames[0].save(
        art_gif,
        save_all=True,
        append_images=frames[1:],
        duration=50,
        loop=0,
        optimize=False,
    )
    print(f"Saved animated icon ({os.path.getsize(out_gif) // 1024} KB)")

if __name__ == "__main__":
    generate_animated_icon()
