import os
from PIL import Image, ImageFilter
import numpy as np
from scipy.ndimage import label, binary_fill_holes

U_DIR = r"C:/Users/cat97/.gemini/antigravity/brain/02297bf2-b1c1-4fa2-927a-5961238d30fc/.user_uploaded"
ART_DIR = r"C:/Users/cat97/.gemini/antigravity/brain/02297bf2-b1c1-4fa2-927a-5961238d30fc"
OUT_DIR = "public/emojis"
os.makedirs(OUT_DIR, exist_ok=True)

# ==============================================================================
# 1. ARSHADOW BUFF (The Black Oval)
# ==============================================================================
def process_arshadow_buff():
    img = Image.open(os.path.join(U_DIR, "media_1794093285340_6796ee55.webp")).convert("RGB")
    arr = np.array(img)
    # The oval is in crop region [160:420, 260:640]
    crop = arr[160:420, 260:640]
    lum = np.max(crop, axis=2)

    # Detect the black oval (interior is 0, 0, 0)
    mask = (lum < 20)
    lbl, n = label(mask)
    c_label = lbl[126, 192]
    oval_mask = binary_fill_holes(lbl == c_label)

    # Tight crop
    y_idx, x_idx = np.where(oval_mask)
    y1, y2 = y_idx.min(), y_idx.max()
    x1, x2 = x_idx.min(), x_idx.max()
    pad = 8
    y_start, y_end = max(0, y1 - pad), min(crop.shape[0], y2 + pad + 1)
    x_start, x_end = max(0, x1 - pad), min(crop.shape[1], x2 + pad + 1)

    m_crop = oval_mask[y_start:y_end, x_start:x_end].astype(np.float32)
    mask_img = Image.fromarray((m_crop * 255).astype(np.uint8), mode="L")
    mask_smooth = mask_img.filter(ImageFilter.GaussianBlur(radius=1.0))

    # Opaque black oval with smooth alpha
    oval_rgba = Image.new("RGBA", mask_img.size, (0, 0, 0, 0))
    oval_rgba.paste(Image.new("RGBA", mask_img.size, (0, 0, 0, 255)), (0, 0), mask_smooth)

    # Scale to 128x128
    w, h = oval_rgba.size
    scale = 118.0 / max(w, h)
    nw, nh = int(w * scale), int(h * scale)
    resized = oval_rgba.resize((nw, nh), Image.Resampling.LANCZOS)

    final = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    final.paste(resized, ((128 - nw) // 2, (128 - nh) // 2), resized)

    final.save(os.path.join(OUT_DIR, "arshadow_buff.png"), "PNG", optimize=True)
    final.save(os.path.join(ART_DIR, "arshadow_buff.png"), "PNG", optimize=True)
    print("Saved arshadow_buff.png")

# ==============================================================================
# 2. OFFICIAL EXTREME DEMON FACE
# ==============================================================================
def process_extreme_demon():
    img = Image.open(os.path.join(U_DIR, "media_1794092957530_21b8813c.webp")).convert("RGB")
    arr = np.array(img).astype(np.float32)

    diff_bg = np.max(np.abs(arr - 247.0), axis=2)
    bg_seed = (diff_bg < 15.0)
    lbl, n = label(bg_seed)
    border_mask = np.zeros_like(bg_seed)
    border_mask[0, :] = True
    border_mask[-1, :] = True
    border_mask[:, 0] = True
    border_mask[:, -1] = True
    border_labels = np.unique(lbl[border_mask])
    border_labels = border_labels[border_labels > 0]
    is_bg = np.isin(lbl, border_labels)

    alpha = np.where(is_bg, 0.0, 1.0)
    rgba = np.zeros((arr.shape[0], arr.shape[1], 4), dtype=np.uint8)
    rgba[:, :, :3] = np.array(img)
    rgba[:, :, 3] = (alpha * 255.0).astype(np.uint8)

    y_idx, x_idx = np.where(~is_bg)
    crop_rgba = Image.fromarray(rgba).crop((x_idx.min(), y_idx.min(), x_idx.max() + 1, y_idx.max() + 1))

    w, h = crop_rgba.size
    scale = 124.0 / max(w, h)
    nw, nh = int(w * scale), int(h * scale)
    resized = crop_rgba.resize((nw, nh), Image.Resampling.LANCZOS)

    final = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    final.paste(resized, ((128 - nw) // 2, (128 - nh) // 2), resized)

    final.save(os.path.join(OUT_DIR, "ndl_extreme.png"), "PNG", optimize=True)
    final.save(os.path.join(ART_DIR, "ndl_extreme.png"), "PNG", optimize=True)
    print("Saved ndl_extreme.png")

# ==============================================================================
# 3. OFFICIAL NORMAL DIFFICULTY FACE ("FIRE IN THE HOLE")
# ==============================================================================
def process_normal_face():
    img = Image.open(os.path.join(U_DIR, "media_1794092971899_7f02ffdc.webp")).convert("RGB")
    arr = np.array(img).astype(np.float32)

    diff_bg = np.max(np.abs(arr - 247.0), axis=2)
    bg_seed = (diff_bg < 15.0)
    lbl, n = label(bg_seed)
    border_mask = np.zeros_like(bg_seed)
    border_mask[0, :] = True
    border_mask[-1, :] = True
    border_mask[:, 0] = True
    border_mask[:, -1] = True
    border_labels = np.unique(lbl[border_mask])
    border_labels = border_labels[border_labels > 0]
    is_bg = np.isin(lbl, border_labels)

    alpha = np.where(is_bg, 0.0, 1.0)
    rgba = np.zeros((arr.shape[0], arr.shape[1], 4), dtype=np.uint8)
    rgba[:, :, :3] = np.array(img)
    rgba[:, :, 3] = (alpha * 255.0).astype(np.uint8)

    y_idx, x_idx = np.where(~is_bg)
    crop_rgba = Image.fromarray(rgba).crop((x_idx.min(), y_idx.min(), x_idx.max() + 1, y_idx.max() + 1))

    w, h = crop_rgba.size
    scale = 124.0 / max(w, h)
    nw, nh = int(w * scale), int(h * scale)
    resized = crop_rgba.resize((nw, nh), Image.Resampling.LANCZOS)

    final = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    final.paste(resized, ((128 - nw) // 2, (128 - nh) // 2), resized)

    final.save(os.path.join(OUT_DIR, "fire_in_the_hole.png"), "PNG", optimize=True)
    final.save(os.path.join(ART_DIR, "fire_in_the_hole.png"), "PNG", optimize=True)
    print("Saved fire_in_the_hole.png")

# ==============================================================================
# 4. OFFICIAL SECRET COIN
# ==============================================================================
def process_secret_coin():
    img = Image.open(os.path.join(U_DIR, "media_1794093008485_68a60cc7.webp")).convert("RGB")
    arr = np.array(img).astype(np.float32)
    cx, cy = 430.0, 281.0
    yy, xx = np.mgrid[0:arr.shape[0], 0:arr.shape[1]].astype(np.float32)
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)

    def smoothstep(e0, e1, x):
        v = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
        return v * v * (3 - 2 * v)

    alpha = 1.0 - smoothstep(241.5, 243.5, dist)
    rgba = np.zeros((arr.shape[0], arr.shape[1], 4), dtype=np.uint8)
    rgba[:, :, :3] = np.array(img)
    rgba[:, :, 3] = (alpha * 255.0).astype(np.uint8)

    r_box = 245
    coin_crop = Image.fromarray(rgba).crop((int(cx - r_box), int(cy - r_box), int(cx + r_box), int(cy + r_box)))
    coin_128 = coin_crop.resize((124, 124), Image.Resampling.LANCZOS)

    final = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    final.paste(coin_128, (2, 2), coin_128)

    final.save(os.path.join(OUT_DIR, "ndl_coin.png"), "PNG", optimize=True)
    final.save(os.path.join(ART_DIR, "ndl_coin.png"), "PNG", optimize=True)
    print("Saved ndl_coin.png")

if __name__ == "__main__":
    process_arshadow_buff()
    process_extreme_demon()
    process_normal_face()
    process_secret_coin()
