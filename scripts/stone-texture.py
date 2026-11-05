"""Light honed limestone for the Cygnus ground, modelled on the brand book's
own stone (Textures, p. 58): cream ground, fine sandy grain, crisp dark specks
and fossil slivers, a few calcite flecks, soft small-scale clouding.

Layers (each periodic, so they tile without seams; periods differ):
  stone-mottle.webp  192 px RGB, shown at 1536 CSS px: soft tonal clouding.
  stone-detail.webp  2x RGBA, shown at TILE CSS px: specks, slivers, flecks,
                     drawn analytically (anti-aliased) so they stay crisp on
                     retina screens; mostly transparent, so lossless is small.
The fine sand grain is drawn by the browser (two SVG feTurbulence layers in
globals.css). Both files are lossless WebP: lossy encoding bands the mottle.

usage: python3 scripts/stone-texture.py public/textures [TILE_CSS_PX]
       (needs numpy and Pillow; TILE must match the 1024px size in globals.css)
"""
import sys
import numpy as np
from PIL import Image

OUT = sys.argv[1]
TILE = int(sys.argv[2]) if len(sys.argv) > 2 else 1024  # CSS px
S = 2  # device px per CSS px in the detail layer
D = TILE * S
BASE = np.array([252.0, 243.0, 232.0])  # Warm Beige #FCF3E8
# The grain and specks darken the surface a little on average; the mottle sits
# that much lighter so the page still averages to the Warm Beige.
LIFT = np.array([3.0, 4.5, 4.0])


def spectral(n, beta, seed, ax=1.0, ay=1.0):
    r = np.random.default_rng(seed)
    F = np.fft.fft2(r.standard_normal((n, n)))
    fy = np.fft.fftfreq(n)[:, None] * ay
    fx = np.fft.fftfreq(n)[None, :] * ax
    f = np.sqrt(fx * fx + fy * fy)
    f[0, 0] = np.inf
    out = np.real(np.fft.ifft2(F * f ** (-beta / 2)))
    out -= out.mean()
    return out / out.std()


# ---- mottle: soft clouding, smaller and quieter than paper clouds ----------
M = 192
L = 0.006 * spectral(M, 2.6, 31) + 0.011 * spectral(M, 1.3, 32)
L = np.where(L > 0, L * 0.6, L)  # lights subtler than darks, nothing clips
# Warm patches lean honey, cool patches lean grey-green (as limestone does),
# never towards lilac.
t = spectral(M, 3.0, 33)[..., None]
tint = np.where(t > 0, t * np.array([0.5, 0.15, -0.8]), -t * np.array([-0.7, -0.3, -0.1]))
mottle = np.clip(np.round((BASE + LIFT) * (1 + L[..., None]) + tint), 0, 255).astype(np.uint8)
Image.fromarray(mottle, "RGB").save(f"{OUT}/stone-mottle.webp", lossless=True, quality=100, method=6, exact=True)

# ---- detail: specks, slivers, calcite flecks -------------------------------
rng = np.random.default_rng(2003)
rgb = np.zeros((D, D, 3))  # premultiplied colour
alpha = np.zeros((D, D))

# Density varies across the slab, as it does in real stone.
dens = spectral(64, 2.2, 34)
dens = (dens - dens.min()) / (dens.max() - dens.min())


def stamp(cx, cy, a, b, ang, col, op, soft=0.75):
    """Anti-aliased ellipse (semi-axes a, b in device px) composited 'over'."""
    R = int(np.ceil(max(a, b) + 3))
    ys = np.arange(-R, R + 1)
    yy, xx = np.meshgrid(ys, ys, indexing="ij")
    fx = xx - (cx - np.floor(cx))
    fy = yy - (cy - np.floor(cy))
    c, s = np.cos(ang), np.sin(ang)
    u = (fx * c + fy * s) / a
    v = (-fx * s + fy * c) / b
    d = (np.sqrt(u * u + v * v) - 1) * min(a, b)  # ~signed distance in px
    cov = np.clip(0.5 - d / (2 * soft), 0, 1) * op
    iy = (int(np.floor(cy)) + ys) % D
    ix = (int(np.floor(cx)) + ys) % D
    idx = np.ix_(iy, ix)
    a0 = alpha[idx]
    alpha[idx] = cov + a0 * (1 - cov)
    rgb[idx] = col * cov[..., None] + rgb[idx] * (1 - cov[..., None])


def accept(x, y):
    return rng.random() < 0.35 + 0.65 * dens[int(y / D * 64) % 64, int(x / D * 64) % 64]


area = TILE * TILE
n_dark = int(area / 1250)   # ~1 speck per 1900 CSS px², as in the reference
n_sliver = int(area / 16000)
n_calcite = int(area / 4200)
n_cluster = int(area / 30000)  # oolitic clusters: a few grains together
n_dust = int(area / 700)    # very faint micro-specks: the "sand" between specks

# Warm mineral browns, lighter than the ink (#686763) and never neutral grey,
# so a speck beside a word reads as stone, not as punctuation.
dark_cols = np.array([[122, 104, 84], [134, 115, 93], [112, 97, 80], [144, 124, 100]], float)

def speck(x, y, r, col, op):
    """An irregular grain: 2-4 overlapping ellipses jittered within r, so the
    outline reads as a broken mineral fragment rather than a printed dot."""
    k = rng.integers(2, 5)
    for _ in range(k):
        jx, jy = rng.normal(0, r * 0.45, 2)
        rr = r * rng.uniform(0.45, 0.85)
        stamp(x + jx, y + jy, rr, rr * rng.uniform(0.5, 1.0), rng.uniform(0, np.pi),
              col * rng.uniform(0.94, 1.06), op * rng.uniform(0.75, 1.0), soft=0.85)


placed = 0
while placed < n_dark:
    x, y = rng.uniform(0, D, 2)
    if not accept(x, y):
        continue
    r = S * rng.choice([rng.uniform(0.5, 0.9), rng.uniform(0.9, 1.5), rng.uniform(1.5, 2.2)], p=[0.58, 0.36, 0.06])
    col = dark_cols[rng.integers(4)]
    op = rng.uniform(0.16, 0.4)
    if r < S * 0.75:
        stamp(x, y, r, r * rng.uniform(0.6, 1.0), rng.uniform(0, np.pi), col, op, soft=0.85)
    else:
        speck(x, y, r, col, op)
    placed += 1

for _ in range(n_sliver):  # fossil fragments: short, slightly bent, blunt
    x, y = rng.uniform(0, D, 2)
    ang = rng.uniform(0, np.pi)
    ln = S * rng.uniform(1.0, 2.2)
    wd = S * rng.uniform(0.45, 0.8)
    col = dark_cols[rng.integers(4)]
    op = rng.uniform(0.14, 0.28)
    bend = rng.uniform(-0.6, 0.6)
    for t in (-0.5, 0.5):
        ox = np.cos(ang) * ln * t * 0.9 - np.sin(ang) * wd * bend * abs(t)
        oy = np.sin(ang) * ln * t * 0.9 + np.cos(ang) * wd * bend * abs(t)
        stamp(x + ox, y + oy, ln * 0.62, wd * rng.uniform(0.7, 1.0), ang + bend * t * 0.5, col, op, soft=0.6)

for _ in range(n_dust):
    x, y = rng.uniform(0, D, 2)
    stamp(x, y, S * rng.uniform(0.28, 0.5), S * rng.uniform(0.22, 0.45), rng.uniform(0, np.pi), dark_cols[rng.integers(4)], rng.uniform(0.06, 0.13))

for _ in range(n_cluster):
    cx, cy = rng.uniform(0, D, 2)
    for _ in range(rng.integers(3, 9)):
        jx, jy = rng.normal(0, S * 3.5, 2)
        rr = S * rng.uniform(0.45, 0.9)
        stamp(cx + jx, cy + jy, rr, rr * rng.uniform(0.6, 1.0), rng.uniform(0, np.pi), dark_cols[rng.integers(4)], rng.uniform(0.12, 0.28), soft=0.85)

for _ in range(n_calcite):  # light flecks
    x, y = rng.uniform(0, D, 2)
    r = S * rng.uniform(0.8, 1.8)
    speck(x, y, r, np.array([255.0, 254.0, 250.0]), rng.uniform(0.5, 0.85))

out = np.zeros((D, D, 4), np.uint8)
safe = np.maximum(alpha, 1e-6)[..., None]
# Quantise (colour to steps of 8, alpha to 24 levels): invisible at this
# scale, and it roughly halves the lossless file.
col = np.round(rgb / safe / 8) * 8
out[..., :3] = np.clip(col, 0, 255).astype(np.uint8)
out[..., 3] = np.clip(np.round(np.round(alpha * 24) / 24 * 255), 0, 255).astype(np.uint8)
out[alpha < 1 / 255] = 0
Image.fromarray(out, "RGBA").save(f"{OUT}/stone-detail.webp", lossless=True, quality=100, method=6, exact=True)

print("tile", TILE, "detail px", D, "specks", n_dark, n_sliver, n_calcite, n_dust)
print("mottle min", mottle.reshape(-1, 3).min(0), "max", mottle.reshape(-1, 3).max(0))
