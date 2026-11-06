"""
Plaster relief maps for the Home background (Immersive Garden's sculpted wall).

The page draws each relief as *shading only*: a grey map where 128 is the flat
wall, darker is shadow and lighter is highlight. The WebGL layer adds that
shading onto the stone ground, so the motifs look carved out of the same stone.

Two ways to make a map:

  python3 scripts/relief.py convert photo.png public/images/relief/swan.webp [1280 560]
      From an image of a relief on a flat wall (the Higgsfield stand-ins, or a
      real photograph later): the wall is estimated and removed, leaving the
      relief's shading, centred on 128. With two widths it writes the page's
      set: swan.webp and swan-h.webp (shading and height) at the first width
      (desktop), swan-s.webp and swan-h-s.webp at the second (phones). Size
      each to its largest placement: about 21.6 px per vw of width on desktop,
      6 px per vw on phones. The height lets the page relight the relief with
      the cursor.

  python3 scripts/relief.py procedural public/images/relief
      Draws the house's own motifs (swan feathers, the Cygnus constellation,
      blossoms, ripples) as height fields and lights them from the upper left.

Requires numpy, scipy and Pillow.
"""

import math
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from scipy.spatial import cKDTree

LIGHT = np.array([-0.55, -0.62, 0.56])
LIGHT = LIGHT / np.linalg.norm(LIGHT)


# --------------------------------------------------------------------------
# Output


def save_map(shade, path, gain=520.0):
    """shade: signed shading (0 = wall). Writes a 128-centred grey WebP."""
    g = np.clip(128.0 + shade * gain, 0, 255).astype(np.uint8)
    Image.fromarray(g, "L").convert("RGB").save(path, "WEBP", quality=88, method=6)
    print(f"{path}  {g.shape[1]}x{g.shape[0]}  {os.path.getsize(path) // 1024} KB")


def shade_height(H, scale=1.0, shadow=(9, 7), shadow_k=0.006, ao_k=0.004):
    """Light a height field (px units) from the upper left; return signed shading."""
    Hs = ndi.gaussian_filter(H, 0.9)
    gy, gx = np.gradient(Hs)
    nx, ny, nz = -gx * scale, -gy * scale, np.ones_like(H)
    n = np.sqrt(nx * nx + ny * ny + nz * nz)
    diff = (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / n
    s = diff - LIGHT[2]
    # Cavities hold a little shadow.
    ao = ndi.gaussian_filter(Hs, 7) - Hs
    s -= ao_k * np.clip(ao, 0, None)
    # The relief casts a soft shadow on the wall, away from the light.
    up_left = ndi.shift(Hs, shadow, order=1, mode="constant")
    cast = ndi.gaussian_filter(np.clip(up_left - Hs - 1.5, 0, None), 7)
    s -= shadow_k * cast
    return s


# --------------------------------------------------------------------------
# Geometry helpers


def grid(w, h):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    return x, y


def bezier(ps, n=700):
    """Cubic or quadratic Bezier through control points ps (list of (x, y))."""
    t = np.linspace(0, 1, n)[:, None]
    p = [np.array(q, dtype=np.float64) for q in ps]
    if len(p) == 3:
        pts = (1 - t) ** 2 * p[0] + 2 * (1 - t) * t * p[1] + t ** 2 * p[2]
    else:
        pts = (1 - t) ** 3 * p[0] + 3 * (1 - t) ** 2 * t * p[1] + 3 * (1 - t) * t ** 2 * p[2] + t ** 3 * p[3]
    return pts


def curve_field(pts, x, y, box=None):
    """Distance to a polyline, index of the nearest point, side (+1/-1), arc length there."""
    tree = cKDTree(pts)
    q = np.stack([x.ravel(), y.ravel()], 1)
    d, i = tree.query(q, k=1)
    d = d.reshape(x.shape).astype(np.float32)
    i = i.reshape(x.shape)
    tang = np.gradient(pts, axis=0)
    tang /= np.linalg.norm(tang, axis=1, keepdims=True)
    dx = x - pts[i, 0]
    dy = y - pts[i, 1]
    side = np.sign(tang[i, 0] * dy - tang[i, 1] * dx)
    seg = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
    return d, i, side, seg[i], seg[-1]


def hash1(a, seed):
    a = np.asarray(a, dtype=np.int64)
    v = (a * 374761393 + seed * 668265263) & 0xFFFFFFFF
    v = ((v ^ (v >> 13)) * 1274126177) & 0xFFFFFFFF
    return (v & 0xFFFF) / 65535.0


def value_noise(shape, scale, seed):
    rng = np.random.default_rng(seed)
    h, w = shape
    g = rng.random((int(h / scale) + 3, int(w / scale) + 3))
    return ndi.zoom(g, scale, order=3)[:h, :w]


def sub(x, y, cx, cy, r):
    """Bounding box slices around (cx, cy) with radius r, clipped to the grid."""
    h, w = x.shape
    x0, x1 = max(0, int(cx - r)), min(w, int(cx + r) + 1)
    y0, y1 = max(0, int(cy - r)), min(h, int(cy + r) + 1)
    return (slice(y0, y1), slice(x0, x1))


# --------------------------------------------------------------------------
# Motifs (heights in px)


def feather(H, x, y, ctrl, width, seed, barb=0.042, lean=1.3):
    pts = bezier(ctrl)
    xs, ys = pts[:, 0], pts[:, 1]
    pad = width * 1.3
    sl = (slice(max(0, int(ys.min() - pad)), int(ys.max() + pad)), slice(max(0, int(xs.min() - pad)), int(xs.max() + pad)))
    X, Y = x[sl], y[sl]
    d, i, side, along, total = curve_field(pts, X, Y)
    t = along / total
    # Vane: bare quill at the base, full in the middle, tapering to a soft tip.
    prof = np.clip((t - 0.1) / 0.18, 0, 1) ** 0.6 * np.clip(np.sin(np.pi * np.clip(t, 0, 1) ** 0.8), 0, 1) ** 0.55
    w = width * prof * np.where(side > 0, 1.0, 0.68)
    # Barbs: soft grooves sweeping outward and toward the tip, curving.
    k = lean + 0.0025 * d
    phase = (along - k * d) * barb
    # Splits: a few barbs part near the edge, as on a real feather.
    idx = np.floor(phase / 3.0).astype(np.int64) * 2 + (side > 0)
    split = hash1(idx, seed) < 0.22
    jag = value_noise(X.shape, 26, seed) - 0.5
    u = d / np.maximum(w, 1e-3) + jag * 0.05
    u = u + np.where(split, 0.22 * np.clip((u - 0.45) / 0.5, 0, 1), 0)
    vane = np.sqrt(np.clip(1 - u ** 2, 0, 1)) * width * 0.15 * (0.35 + 0.65 * prof)
    vane *= 0.88 + 0.12 * (0.5 + 0.5 * np.cos(phase * 2 * np.pi))
    # Softer, downy barbs near the quill.
    down = np.clip((0.3 - t) / 0.2, 0, 1)
    vane *= 1 - down * (0.25 + 0.15 * value_noise(X.shape, 12, seed + 1))
    # Rachis (shaft): a rounded ridge tapering to the tip.
    rw = width * (0.05 * (1 - t) + 0.012)
    rach = np.sqrt(np.clip(1 - (d / rw) ** 2, 0, 1)) * width * 0.11 * (1.15 - 0.6 * t)
    rach *= t < 0.995
    H[sl] = np.maximum(H[sl], np.maximum(vane, rach))


def star4(H, x, y, cx, cy, r, h, p=0.62, rot=0.0):
    sl = sub(x, y, cx, cy, r * 1.05)
    X, Y = x[sl] - cx, y[sl] - cy
    c, s = math.cos(rot), math.sin(rot)
    u, v = X * c + Y * s, -X * s + Y * c
    q = (np.abs(u) ** p + np.abs(v) ** p) ** (1 / p) / r
    star = h * np.clip(1 - q, 0, 1) ** 1.15
    H[sl] = np.maximum(H[sl], star)


def ridge_line(H, x, y, a, b, w, h):
    a, b = np.array(a, float), np.array(b, float)
    pad = w * 3
    sl = (slice(max(0, int(min(a[1], b[1]) - pad)), int(max(a[1], b[1]) + pad)), slice(max(0, int(min(a[0], b[0]) - pad)), int(max(a[0], b[0]) + pad)))
    X, Y = x[sl], y[sl]
    ab = b - a
    t = np.clip(((X - a[0]) * ab[0] + (Y - a[1]) * ab[1]) / (ab @ ab), 0, 1)
    d = np.hypot(X - (a[0] + t * ab[0]), Y - (a[1] + t * ab[1]))
    line = h * np.sqrt(np.clip(1 - (d / w) ** 2, 0, 1))
    H[sl] = np.maximum(H[sl], line)


def tube(H, x, y, ctrl, w0, w1, h):
    pts = bezier(ctrl)
    pad = max(w0, w1) * 2
    xs, ys = pts[:, 0], pts[:, 1]
    sl = (slice(max(0, int(ys.min() - pad)), int(ys.max() + pad)), slice(max(0, int(xs.min() - pad)), int(xs.max() + pad)))
    X, Y = x[sl], y[sl]
    d, i, side, along, total = curve_field(pts, X, Y)
    t = along / total
    w = w0 + (w1 - w0) * t
    body = h * (w / w0) * np.sqrt(np.clip(1 - (d / w) ** 2, 0, 1))
    body *= (t < 0.998)
    H[sl] = np.maximum(H[sl], body)


def leaf(H, x, y, cx, cy, length, width, rot, h, seed):
    sl = sub(x, y, cx, cy, length * 0.6)
    X, Y = x[sl] - cx, y[sl] - cy
    c, s = math.cos(rot), math.sin(rot)
    u, v = (X * c + Y * s) / (length / 2), (-X * s + Y * c) / (width / 2)
    # Lens outline with a slight curl; pointed at both ends.
    v = v + 0.25 * u ** 2
    edge = 1 - u ** 2
    inside = np.clip(1 - (np.abs(v) / np.maximum(edge, 1e-3)) ** 2, 0, 1) * (edge > 0)
    body = h * np.sqrt(inside) * (0.6 + 0.4 * np.clip(edge, 0, 1))
    body *= 1 - 0.35 * np.exp(-(v / 0.06) ** 2)  # midrib groove
    veins = 0.5 + 0.5 * np.cos((u * 7 + np.abs(v) * 2.2) * np.pi)
    body *= 0.9 + 0.1 * veins
    H[sl] = np.maximum(H[sl], body)


def blossom(H, x, y, cx, cy, R, rot, h, petals=5, cup=0.3):
    sl = sub(x, y, cx, cy, R * 1.15)
    X, Y = x[sl] - cx, y[sl] - cy
    out = np.zeros_like(X)
    for k in range(petals):
        a = rot + 2 * math.pi * k / petals
        c, s = math.cos(a), math.sin(a)
        u = X * c + Y * s - 0.5 * R
        v = -X * s + Y * c
        e = (u / (0.52 * R)) ** 2 + (v / (0.4 * R)) ** 2
        petal = np.sqrt(np.clip(1 - e, 0, 1)) * h * (1 - cup + cup * np.clip(0.5 + u / R, 0, 1.2))
        petal *= 1 - 0.55 * np.exp(-((u - 0.48 * R) / (0.1 * R)) ** 2 - (v / (0.05 * R)) ** 2)  # notch
        petal *= 1 - 0.1 * np.exp(-(v / (0.03 * R)) ** 2)
        out = np.maximum(out, petal)
    r = np.hypot(X, Y)
    centre = h * 0.9 * np.sqrt(np.clip(1 - (r / (0.2 * R)) ** 2, 0, 1))
    ang = np.arctan2(Y, X)
    stamens = 0.5 + 0.5 * np.cos(ang * 14)
    centre *= 0.82 + 0.18 * stamens
    H[sl] = np.maximum(H[sl], np.maximum(out, centre))


def ripples(H, x, y, cx, cy, radii, w, h, aspect=0.32):
    r = np.hypot((x - cx), (y - cy) / aspect)
    for k, rk in enumerate(radii):
        amp = h * (1 - k / (len(radii) + 1))
        ring = amp * np.exp(-((r - rk) / w) ** 2)
        H[:] = np.maximum(H, ring)


# --------------------------------------------------------------------------
# Compositions


def procedural(outdir):
    os.makedirs(outdir, exist_ok=True)

    # a: a great swan feather, two small ones drifting after it (3:2)
    w, h = 1800, 1200
    x, y = grid(w, h)
    H = np.zeros((h, w), np.float32)
    feather(H, x, y, [(300, 1020), (620, 760), (1060, 420), (1560, 210)], 230, seed=3)
    feather(H, x, y, [(1180, 1060), (1300, 980), (1420, 900)], 92, seed=7, barb=0.07)
    feather(H, x, y, [(380, 300), (470, 250), (600, 210)], 70, seed=9, barb=0.08)
    save_map(shade_height(H), f"{outdir}/relief-a.webp")

    # b: the Cygnus constellation (the Northern Cross) in four-point stars (1:1)
    w = h = 1400
    x, y = grid(w, h)
    H = np.zeros((h, w), np.float32)
    deneb, sadr, albireo, gienah, delta = (700, 230), (690, 560), (700, 1180), (330, 700), (1060, 470)
    for a, b in [(deneb, sadr), (sadr, albireo), (gienah, sadr), (sadr, delta)]:
        ridge_line(H, x, y, a, b, 6, 7)
    for (cx, cy), r in [(deneb, 120), (sadr, 96), (albireo, 86), (gienah, 82), (delta, 78)]:
        star4(H, x, y, cx, cy, r, r * 0.38)
    rng = np.random.default_rng(12)
    for _ in range(14):
        cx, cy = rng.uniform(140, 1260, 2)
        if min(math.hypot(cx - p[0], cy - p[1]) for p in (deneb, sadr, albireo, gienah, delta)) < 150:
            continue
        r = rng.uniform(16, 34)
        star4(H, x, y, cx, cy, r, r * 0.4, rot=rng.uniform(-0.3, 0.3))
    # Two fine orbits around the cross, as on a celestial chart.
    for r, w_, h_ in [(560, 5, 6), (604, 3, 4)]:
        a = np.linspace(math.radians(120), math.radians(400), 900)
        pts = np.stack([sadr[0] + r * np.cos(a), sadr[1] + r * np.sin(a) * 0.92], 1)
        for p, q in zip(pts[:-1:6], pts[6::6]):
            ridge_line(H, x, y, p, q, w_, h_)
    save_map(shade_height(H), f"{outdir}/relief-b.webp")

    # c: a blossoming branch, running diagonally (3:2)
    w, h = 1800, 1200
    x, y = grid(w, h)
    H = np.zeros((h, w), np.float32)
    tube(H, x, y, [(150, 1080), (600, 820), (1100, 700), (1680, 260)], 26, 7, 26)
    tube(H, x, y, [(820, 790), (900, 640), (1010, 560), (1120, 420)], 13, 5, 16)
    tube(H, x, y, [(520, 880), (610, 960), (720, 1010), (840, 1040)], 12, 4, 14)
    rng = np.random.default_rng(5)
    for cx, cy, R in [(1120, 400, 108), (1460, 360, 92), (700, 760, 120), (420, 930, 84), (1290, 590, 70), (850, 1040, 64)]:
        blossom(H, x, y, cx, cy, R, rng.uniform(0, 1.2), R * 0.32)
    for cx, cy, L, W, rot in [(980, 790, 190, 66, -0.9), (560, 760, 170, 58, -2.4), (1300, 470, 160, 54, -0.3), (1580, 300, 150, 48, -1.4), (300, 1010, 160, 56, 2.6), (960, 560, 150, 52, 0.7)]:
        leaf(H, x, y, cx, cy, L, W, rot, 18, 1)
    save_map(shade_height(H), f"{outdir}/relief-c.webp")

    # d: ripples on water with a feather resting on them (3:2)
    w, h = 1800, 1200
    x, y = grid(w, h)
    H = np.zeros((h, w), np.float32)
    ripples(H, x, y, 900, 760, [150, 300, 470, 650, 840], 34, 14)
    feather(H, x, y, [(640, 840), (800, 770), (980, 700), (1160, 650)], 120, seed=21, barb=0.065)
    save_map(shade_height(H, shadow=(7, 5)), f"{outdir}/relief-d.webp")

    # e: a cluster of open blossoms among leaves (1:1)
    w = h = 1400
    x, y = grid(w, h)
    H = np.zeros((h, w), np.float32)
    for cx, cy, L, W, rot in [(420, 560, 300, 104, 2.5), (980, 520, 280, 96, 0.5), (760, 980, 300, 100, 1.7), (430, 900, 240, 84, -2.2), (1010, 900, 250, 86, -0.8)]:
        leaf(H, x, y, cx, cy, L, W, rot, 26, 2)
    tube(H, x, y, [(700, 1300), (690, 1150), (720, 980), (700, 820)], 16, 9, 18)
    for cx, cy, R, rot in [(700, 640, 230, 0.2), (430, 760, 160, 0.9), (960, 760, 170, 0.5)]:
        blossom(H, x, y, cx, cy, R, rot, R * 0.3, petals=5, cup=0.4)
        blossom(H, x, y, cx, cy, R * 0.62, rot + 0.6, R * 0.34, petals=5, cup=0.5)
    save_map(shade_height(H), f"{outdir}/relief-e.webp")


# --------------------------------------------------------------------------
# Conversion of a lit image of a relief on a flat wall


def wall_deviation(src, max_w=1800):
    """Luminance minus the fitted wall, and a fade toward the frame's edges."""
    im = Image.open(src).convert("L")
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    L = np.asarray(im).astype(np.float32) / 255.0
    h, w = L.shape
    # The wall: pixels close to the border tone with little local detail.
    border = np.r_[L[:12].ravel(), L[-12:].ravel(), L[:, :12].ravel(), L[:, -12:].ravel()]
    tone = np.median(border)
    detail = ndi.gaussian_filter(np.abs(L - ndi.gaussian_filter(L, 3)), 6)
    wall = (np.abs(L - tone) < 0.035) & (detail < np.percentile(detail, 55))
    # Fit a smooth surface to the wall (removes vignettes and uneven light).
    yy, xx = np.mgrid[0:h, 0:w]
    u, v = xx / w - 0.5, yy / h - 0.5
    A = np.stack([np.ones_like(u), u, v, u * u, v * v, u * v], -1)
    coef, *_ = np.linalg.lstsq(A[wall], L[wall], rcond=None)
    dev = L - A @ coef
    # Fade the frame so nothing can show a hard edge.
    fade = np.clip(np.minimum.reduce([xx, yy, w - 1 - xx, h - 1 - yy]) / (0.06 * min(w, h)), 0, 1) ** 1.5
    return dev, fade


def convert(src, dst, max_w=1800):
    dev, fade = wall_deviation(src, max_w)
    save_map(dev * fade, dst, gain=255.0 * 1.6)


def height(src, max_w=1800):
    """Relief height (0-1) from a lit image of a pale relief on a darker wall.

    The lit plaster outlines the form: its silhouette is filled and inflated
    with rounded edges, and the image's own fine shading adds the carving.
    Cast shadows stay on the wall. The page relights the relief from this.
    """
    dev, fade = wall_deviation(src, max_w)
    h, w = dev.shape
    s = w / 1800.0
    # A smooth silhouette: the lit plaster, softened before and after closing,
    # so the outline carries no ragged steps for the light to catch.
    lit = ndi.gaussian_filter(dev, 3.0 * s) > 0.01
    r = max(2, round(9 * s))
    yy, xx = np.ogrid[-r : r + 1, -r : r + 1]
    disk = xx * xx + yy * yy <= r * r
    sil = ndi.binary_fill_holes(ndi.binary_closing(lit, structure=disk))
    lab, n = ndi.label(sil)
    if n:
        sizes = ndi.sum(sil, lab, range(1, n + 1))
        sil = np.isin(lab, 1 + np.flatnonzero(sizes > 600 * s * s))
    soft = ndi.gaussian_filter(sil.astype(np.float32), 5 * s)
    # Inflate it gently (rounded shoulders, a low dome), then add the carving.
    dome = ndi.gaussian_filter(1 - np.exp(-ndi.distance_transform_edt(sil) / (40 * s)), 6 * s)
    carving = ndi.gaussian_filter(dev, 1.2 * s) * soft
    H = (0.45 * dome + 3.0 * carving) * fade
    H = np.clip(ndi.gaussian_filter(H, 1.0 * s), 0, None)
    return H / max(H.max(), 1e-6)


def save_pair(arr, dst, w_desk, w_phone, gain=None):
    """Write the desktop map and its -s phone cut from a float array."""
    img = Image.fromarray(np.clip(arr * 255 if gain is None else 128 + arr * gain, 0, 255).astype(np.uint8), "L")
    for w, out in [(w_desk, dst), (w_phone, dst[:-5] + "-s.webp")]:
        cut = img.resize((w, round(img.height * w / img.width)), Image.LANCZOS)
        cut.convert("RGB").save(out, "WEBP", quality=88, method=6)
        print(f"{out}  {cut.width}x{cut.height}  {os.path.getsize(out) // 1024} KB")


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "procedural":
        procedural(sys.argv[2])
    elif len(sys.argv) >= 4 and sys.argv[1] == "convert":
        if len(sys.argv) >= 6:
            # The page's set: shading (name.webp, name-s.webp) and height
            # (name-h.webp, name-h-s.webp), at the desktop and phone widths.
            dev, fade = wall_deviation(sys.argv[2])
            w_desk, w_phone = int(sys.argv[4]), int(sys.argv[5])
            save_pair(dev * fade, sys.argv[3], w_desk, w_phone, gain=255.0 * 1.6)
            save_pair(height(sys.argv[2]), sys.argv[3][:-5] + "-h.webp", w_desk, w_phone)
        else:
            convert(sys.argv[2], sys.argv[3])
    else:
        print(__doc__)
        sys.exit(1)
