import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

def get_rounded_rect_points(num_points=180, w=512, h=512, margin=48, r=88):
    """Generates continuous ordered (x, y) coordinates along the exact squircle neon track."""
    x1, y1 = margin, margin
    x2, y2 = w - margin, h - margin
    
    points = []
    # 1. Top edge
    for x in np.linspace(x1 + r, x2 - r, 25, endpoint=False):
        points.append((float(x), float(y1)))
    # 2. Top-right corner
    for ang in np.linspace(-math.pi/2, 0, 20, endpoint=False):
        points.append((float(x2 - r + r * math.cos(ang)), float(y1 + r + r * math.sin(ang))))
    # 3. Right edge
    for y in np.linspace(y1 + r, y2 - r, 25, endpoint=False):
        points.append((float(x2), float(y)))
    # 4. Bottom-right corner
    for ang in np.linspace(0, math.pi/2, 20, endpoint=False):
        points.append((float(x2 - r + r * math.cos(ang)), float(y2 - r + r * math.sin(ang))))
    # 5. Bottom edge
    for x in np.linspace(x2 - r, x1 + r, 25, endpoint=False):
        points.append((float(x), float(y2)))
    # 6. Bottom-left corner
    for ang in np.linspace(math.pi/2, math.pi, 20, endpoint=False):
        points.append((float(x1 + r + r * math.cos(ang)), float(y2 - r + r * math.sin(ang))))
    # 7. Left edge
    for y in np.linspace(y2 - r, y1 + r, 25, endpoint=False):
        points.append((float(x1), float(y)))
    # 8. Top-left corner
    for ang in np.linspace(math.pi, 3*math.pi/2, 20, endpoint=False):
        points.append((float(x1 + r + r * math.cos(ang)), float(y1 + r + r * math.sin(ang))))
        
    return points

def create_insane_animated_icon(output_path="public/server-icon-animated.gif", num_frames=36, fps=24):
    print(f"[*] Generating {num_frames}-frame INSANE animated Discord server icon...")
    base_img = Image.open('public/logo.png').convert('RGBA')
    w, h = base_img.size

    base_arr = np.array(base_img, dtype=np.float32)
    r = base_arr[:, :, 0]
    g = base_arr[:, :, 1]
    b = base_arr[:, :, 2]
    a = base_arr[:, :, 3]
    brightness = 0.299 * r + 0.587 * g + 0.114 * b

    y_grid = np.arange(h)[:, None]
    x_grid = np.arange(w)[None, :]

    # Masks
    ndl_mask = (brightness > 175) & (y_grid > 180) & (y_grid < 340) & (x_grid > 140) & (x_grid < 370)
    crown_mask = (b > 140) & (g > 100) & (r < 140) & (y_grid > 110) & (y_grid < 230) & (x_grid > 150) & (x_grid < 360)
    border_mask = (b > 140) & (g > 100) & (r < 140) & ((x_grid < 120) | (x_grid > 390) | (y_grid < 120) | (y_grid > 390))

    # Pre-calculated 180 track points for the neon rail
    track_points = get_rounded_rect_points(w=w, h=h, margin=48, r=88)
    num_track = len(track_points)

    # Pre-generate particles for deterministic looping
    np.random.seed(77)
    num_particles = 32
    particles = []
    for _ in range(num_particles):
        px = np.random.uniform(70, w - 70)
        py_start = np.random.uniform(h - 70, h - 15)
        speed = np.random.uniform(160, 280)
        drift_amp = np.random.uniform(10, 24)
        drift_freq = np.random.uniform(1.0, 2.5)
        size = np.random.uniform(2.0, 4.5)
        color_type = np.random.choice(["cyan", "gold", "white"])
        phase = np.random.uniform(0, 1)
        particles.append({
            "px": px,
            "py_start": py_start,
            "speed": speed,
            "drift_amp": drift_amp,
            "drift_freq": drift_freq,
            "size": size,
            "color_type": color_type,
            "phase": phase
        })

    frames = []

    for f in range(num_frames):
        t = f / num_frames # 0.0 to 1.0
        frame_arr = base_arr.copy()

        # 1. Specular diamond sheen sweep across "NDL" letters
        # Sheen line moves diagonally across the center
        sheen_pos = -80 + (w + 160) * ((t * 1.5) % 1.0)
        line_dist = (x_grid + 0.65 * y_grid - sheen_pos)
        sheen_intensity = np.exp(-(line_dist ** 2) / (28.0 ** 2))

        sheen_active = ndl_mask & (sheen_intensity > 0.04)
        frame_arr[sheen_active, 0] = np.clip(frame_arr[sheen_active, 0] + 190 * sheen_intensity[sheen_active], 0, 255)
        frame_arr[sheen_active, 1] = np.clip(frame_arr[sheen_active, 1] + 240 * sheen_intensity[sheen_active], 0, 255)
        frame_arr[sheen_active, 2] = np.clip(frame_arr[sheen_active, 2] + 255 * sheen_intensity[sheen_active], 0, 255)

        # 2. Crown / Chevron Electric Energy Pulse
        crown_glow = 0.5 + 0.5 * math.sin(t * 2 * math.pi)
        crown_boost = crown_glow * 65
        frame_arr[crown_mask, 0] = np.clip(frame_arr[crown_mask, 0] + crown_boost * 0.4, 0, 255)
        frame_arr[crown_mask, 1] = np.clip(frame_arr[crown_mask, 1] + crown_boost * 0.85, 0, 255)
        frame_arr[crown_mask, 2] = np.clip(frame_arr[crown_mask, 2] + crown_boost * 1.25, 0, 255)

        # 3. Outer Neon Frame Pulse
        border_glow = 0.5 + 0.5 * math.cos(t * 2 * math.pi)
        border_boost = border_glow * 50
        frame_arr[border_mask, 0] = np.clip(frame_arr[border_mask, 0] + border_boost * 0.35, 0, 255)
        frame_arr[border_mask, 1] = np.clip(frame_arr[border_mask, 1] + border_boost * 0.75, 0, 255)
        frame_arr[border_mask, 2] = np.clip(frame_arr[border_mask, 2] + border_boost * 1.05, 0, 255)

        # Vector overlays on PIL Image
        frame_img = Image.fromarray(np.uint8(frame_arr), mode="RGBA")
        overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)

        # 4. Laser Comet riding precisely along the squircle neon rail
        track_idx = int(t * num_track) % num_track
        # Tail length: 12 segments
        tail_len = 12
        for tail in range(tail_len - 1, -1, -1):
            tail_idx = (track_idx - tail) % num_track
            bx, by = track_points[tail_idx]
            tail_ratio = tail / float(tail_len)
            r_size = 14.0 - tail_ratio * 9.0
            alpha = int(220 * (1.0 - tail_ratio))
            # Outer cyan glow
            draw.ellipse([bx - r_size * 1.6, by - r_size * 1.6, bx + r_size * 1.6, by + r_size * 1.6], fill=(6, 182, 212, alpha // 3))
            # Intense cyan body
            draw.ellipse([bx - r_size, by - r_size, bx + r_size, by + r_size], fill=(56, 189, 248, alpha))

        # Diamond white head of the comet
        head_x, head_y = track_points[track_idx]
        draw.ellipse([head_x - 5, head_y - 5, head_x + 5, head_y + 5], fill=(255, 255, 255, 255))
        draw.ellipse([head_x - 9, head_y - 9, head_x + 9, head_y + 9], fill=(224, 242, 254, 180))

        # 5. Star flare on the "D" when sheen crosses the center
        sheen_cycle = (t * 1.5) % 1.0
        if 0.40 <= sheen_cycle <= 0.60:
            flare_int = math.sin((sheen_cycle - 0.40) / 0.20 * math.pi)
            fx, fy = 256, 260
            flare_len = int(28 * flare_int)
            # 4-point star burst
            draw.line([(fx - flare_len, fy), (fx + flare_len, fy)], fill=(255, 255, 255, int(230 * flare_int)), width=3)
            draw.line([(fx, fy - flare_len), (fx, fy + flare_len)], fill=(255, 255, 255, int(230 * flare_int)), width=3)
            draw.ellipse([fx - 6, fy - 6, fx + 6, fy + 6], fill=(56, 189, 248, int(255 * flare_int)))
            draw.ellipse([fx - 3, fy - 3, fx + 3, fy + 3], fill=(255, 255, 255, int(255 * flare_int)))

        # 6. Seamless floating cyber-embers (avoiding the text zone to keep typography 100% crisp)
        for p in particles:
            p_prog = (t + p["phase"]) % 1.0
            cur_y = p["py_start"] - p_prog * p["speed"]
            cur_x = p["px"] + p["drift_amp"] * math.sin(p_prog * p["drift_freq"] * 2 * math.pi)

            # Do not draw over the "NERFED DEMONLIST" text banner
            if 345 <= cur_y <= 380 and 95 <= cur_x <= 415:
                continue

            if p_prog < 0.2:
                p_alpha = int(255 * (p_prog / 0.2))
            elif p_prog > 0.75:
                p_alpha = int(255 * ((1.0 - p_prog) / 0.25))
            else:
                p_alpha = 255

            if p_alpha > 0 and 20 <= cur_y <= h - 20:
                rad = p["size"]
                if p["color_type"] == "cyan":
                    p_col = (56, 189, 248, p_alpha)
                    glow_col = (14, 165, 233, p_alpha // 2)
                elif p["color_type"] == "gold":
                    p_col = (250, 204, 21, p_alpha)
                    glow_col = (234, 179, 8, p_alpha // 2)
                else:
                    p_col = (255, 255, 255, p_alpha)
                    glow_col = (125, 211, 252, p_alpha // 2)

                draw.ellipse([cur_x - rad * 1.8, cur_y - rad * 1.8, cur_x + rad * 1.8, cur_y + rad * 1.8], fill=glow_col)
                draw.ellipse([cur_x - rad, cur_y - rad, cur_x + rad, cur_y + rad], fill=p_col)

        # 7. Animated 3 status indicator dots at bottom
        dots_x = [216, 256, 296]
        dot_y = 422
        for idx, dx in enumerate(dots_x):
            dot_phase = (t * 3.0 - idx) % 3.0
            if 0 <= dot_phase < 1.0:
                dot_glow = math.sin(dot_phase * math.pi)
                d_rad = 5.0 + dot_glow * 3.5
                d_alpha = int(180 + 75 * dot_glow)
                draw.ellipse([dx - d_rad * 1.5, dot_y - d_rad * 1.5, dx + d_rad * 1.5, dot_y + d_rad * 1.5], fill=(56, 189, 248, int(d_alpha * 0.4)))
                draw.ellipse([dx - d_rad, dot_y - d_rad, dx + d_rad, dot_y + d_rad], fill=(255, 255, 255, d_alpha))

        # Composite overlay
        composite = Image.alpha_composite(frame_img, overlay)

        # Breathing scale (1.00 to 1.018)
        scale_factor = 1.00 + 0.018 * math.sin(t * 2 * math.pi)
        scaled_w = int(w * scale_factor)
        scaled_h = int(h * scale_factor)
        scaled = composite.resize((scaled_w, scaled_h), Image.Resampling.BILINEAR)

        crop_x = (scaled_w - w) // 2
        crop_y = (scaled_h - h) // 2
        final_frame = scaled.crop((crop_x, crop_y, crop_x + w, crop_y + h))

        final_p = final_frame.convert("RGB").quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
        frames.append(final_p)

    duration_ms = int(1000 / fps)
    print(f"[SAVE] Saving INSANE animated GIF to {output_path} ({len(frames)} frames, {duration_ms}ms/frame)...")
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=duration_ms,
        loop=0,
        optimize=True
    )
    print(f"[SUCCESS] Insane animated icon generated successfully at {output_path}!")

if __name__ == "__main__":
    create_insane_animated_icon()
