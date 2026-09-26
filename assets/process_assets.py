from pathlib import Path
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "raw"
OUT = ROOT.parent / "client" / "public" / "ingredients"
OUT.mkdir(parents=True, exist_ok=True)


def remove_light_neutral_background(image: Image.Image) -> Image.Image:
    rgb = np.asarray(image.convert("RGB"), dtype=np.int16)
    high = rgb.max(axis=2)
    low = rgb.min(axis=2)
    neutral = (high - low < 20) & (high > 168)
    near_white = low > 242
    foreground = ~(neutral | near_white)
    alpha = Image.fromarray((foreground * 255).astype(np.uint8))
    alpha = alpha.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(0.7))
    rgba = image.convert("RGBA")
    rgba.putalpha(alpha)
    return rgba


def remove_edge_neutral_background(image: Image.Image) -> Image.Image:
    """Remove white/checkerboard pixels connected to an image edge.

    The supplied novelty images are flattened previews, so the checkerboard is
    part of the bitmap. Limiting removal to edge-connected pixels protects the
    light details inside the characters better than a global color key.
    """
    rgb = np.asarray(image.convert("RGB"), dtype=np.int16)
    high = rgb.max(axis=2)
    low = rgb.min(axis=2)
    candidate = ((high - low) < 24) & (high > 168)
    height, width = candidate.shape
    outside = np.zeros((height, width), dtype=bool)
    queue: deque[tuple[int, int]] = deque()
    for x in range(width):
        if candidate[0, x]: queue.append((0, x))
        if candidate[height - 1, x]: queue.append((height - 1, x))
    for y in range(height):
        if candidate[y, 0]: queue.append((y, 0))
        if candidate[y, width - 1]: queue.append((y, width - 1))
    while queue:
        y, x = queue.popleft()
        if outside[y, x] or not candidate[y, x]:
            continue
        outside[y, x] = True
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                ny, nx = y + dy, x + dx
                if 0 <= ny < height and 0 <= nx < width and not outside[ny, nx] and candidate[ny, nx]:
                    queue.append((ny, nx))
    alpha = Image.fromarray((~outside * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.65))
    rgba = image.convert("RGBA")
    rgba.putalpha(alpha)
    return rgba


def trim_and_pad(image: Image.Image, padding: int = 16) -> Image.Image:
    bbox = image.getbbox()
    if not bbox:
        return image
    crop = image.crop(bbox)
    canvas = Image.new("RGBA", (crop.width + padding * 2, crop.height + padding * 2))
    canvas.alpha_composite(crop, (padding, padding))
    return canvas


def save_layer(source: Image.Image, name: str, y1: int, y2: int):
    layer = source.crop((115, y1, 685, y2))
    layer = trim_and_pad(remove_light_neutral_background(layer))
    layer.save(OUT / name, optimize=True)


base = Image.open(RAW / "burger-layers.png")
save_layer(base, "bun-sesame-top.png", 25, 170)
save_layer(base, "lettuce.png", 160, 285)
save_layer(base, "onion.png", 270, 355)
save_layer(base, "pickles.png", 335, 415)
save_layer(base, "tomato.png", 400, 485)
save_layer(base, "cheddar.png", 465, 585)
save_layer(base, "beef-classic.png", 555, 670)
save_layer(base, "bun-sesame-bottom.png", 645, 795)


def tint_bun(src_name: str, dst_name: str, color: tuple[int, int, int]):
    image = Image.open(OUT / src_name).convert("RGBA")
    arr = np.asarray(image).copy()
    rgb = arr[:, :, :3].astype(np.float32)
    luminance = rgb.mean(axis=2, keepdims=True) / 255
    tint = np.array(color, dtype=np.float32).reshape(1, 1, 3)
    arr[:, :, :3] = np.clip(tint * (0.45 + luminance * 0.8), 0, 255).astype(np.uint8)
    Image.fromarray(arr, "RGBA").save(OUT / dst_name, optimize=True)


tint_bun("bun-sesame-top.png", "bun-charcoal-top.png", (40, 34, 29))
tint_bun("bun-sesame-bottom.png", "bun-charcoal-bottom.png", (40, 34, 29))
tint_bun("bun-sesame-top.png", "bun-brioche-top.png", (224, 139, 43))
tint_bun("bun-sesame-bottom.png", "bun-brioche-bottom.png", (224, 139, 43))

for source_name, output_name in [
    ("beef-patty.png", "beef-premium.png"),
    ("pork-patty.png", "pork-grill.png"),
    ("chicken-patty.png", "chicken-crispy.png"),
    ("squid-rings.png", "squid-crispy.png"),
]:
    processed = trim_and_pad(remove_light_neutral_background(Image.open(RAW / source_name)), 24)
    processed.thumbnail((650, 260), Image.Resampling.LANCZOS)
    processed.save(OUT / output_name, optimize=True)

chaos_dir = RAW / "chaos"
if chaos_dir.exists():
    for source_path in chaos_dir.glob("*.png"):
        processed = trim_and_pad(remove_edge_neutral_background(Image.open(source_path)), 20)
        processed.thumbnail((440, 440), Image.Resampling.LANCZOS)
        processed.save(OUT / f"chaos-{source_path.name}", optimize=True)

print(f"Created {len(list(OUT.glob('*.png')))} ingredient assets in {OUT}")
