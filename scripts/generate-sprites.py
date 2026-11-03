#!/usr/bin/env python3
"""Sprite zaman batu prosedural (PIL, dari 0, transparan).
Bukan download, bukan rip, bukan aset TheoTown. Palet tanah.
Output: public/batu/*.png (64px tile, 128px bangunan 2x2) + public/batu/icons/*.png
"""
import os, random
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "batu")
ICONS = os.path.join(OUT, "icons")
os.makedirs(OUT, exist_ok=True)
os.makedirs(ICONS, exist_ok=True)

def img(s):
    return Image.new("RGBA", (s, s), (0, 0, 0, 0))

def R(d, x, y, w, h, c):
    d.rectangle([x, y, x + w - 1, y + h - 1], fill=c)

def speckle(d, s, colors, n, seed):
    rnd = random.Random(seed)
    for _ in range(n):
        x, y = rnd.randrange(s), rnd.randrange(s)
        d.point((x, y), fill=rnd.choice(colors))

def outline_box(d, s, c, w=2):
    d.rectangle([0, 0, s - 1, s - 1], outline=c, width=w)

# ---------- terrain tiles 64 ----------
def rumput():
    im, d = img(64), None
    d = ImageDraw.Draw(im)
    R(d, 0, 0, 64, 64, (106, 168, 79, 255))
    speckle(d, 64, [(93, 155, 70, 255), (120, 180, 90, 255), (86, 148, 66, 255)], 220, 11)
    return im

def tanah():
    im = img(64)
    d = ImageDraw.Draw(im)
    R(d, 0, 0, 64, 64, (150, 110, 70, 255))
    speckle(d, 64, [(135, 98, 60, 255), (165, 124, 80, 255), (120, 88, 54, 255)], 200, 22)
    return im

def air():
    im = img(64)
    d = ImageDraw.Draw(im)
    R(d, 0, 0, 64, 64, (64, 130, 190, 255))
    speckle(d, 64, [(84, 150, 205, 255), (52, 115, 175, 255)], 120, 33)
    for y in (14, 34, 54):
        R(d, 8, y, 20, 3, (140, 190, 225, 255))
        R(d, 36, y + 6, 16, 3, (140, 190, 225, 255))
    return im

# ---------- resource nodes 64 ----------
def pohon():
    im = img(64)
    d = ImageDraw.Draw(im)
    R(d, 28, 28, 8, 8, (101, 67, 50, 255))  # batang (tengah, top-down)
    for (x, y, r, c) in [(32, 32, 26, (46, 110, 52, 255)), (22, 24, 14, (58, 130, 62, 255)),
                         (42, 40, 14, (58, 130, 62, 255)), (32, 20, 12, (70, 145, 72, 255))]:
        d.ellipse([x - r, y - r, x + r, y + r], fill=c)
    speckle(d, 64, [(70, 145, 72, 255)], 40, 44)
    return im

def semak_beri():
    im = img(64)
    d = ImageDraw.Draw(im)
    for (x, y, r) in [(24, 30, 15), (40, 34, 15), (32, 42, 13)]:
        d.ellipse([x - r, y - r, x + r, y + r], fill=(62, 128, 60, 255))
    for (x, y) in [(20, 26), (28, 34), (38, 28), (44, 38), (30, 44), (24, 40)]:
        d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=(200, 60, 60, 255))
    return im

def padang_buruan():
    im = img(64)
    d = ImageDraw.Draw(im)
    rnd = random.Random(55)
    for _ in range(26):
        x, y = rnd.randrange(8, 56), rnd.randrange(8, 56)
        R(d, x, y, 3, 9, (150, 170, 80, 255))
        R(d, x + 4, y + 2, 3, 7, (135, 155, 70, 255))
    # tulang (jejak buruan)
    R(d, 28, 44, 10, 3, (235, 225, 200, 255))
    R(d, 26, 42, 3, 3, (235, 225, 200, 255))
    R(d, 26, 47, 3, 3, (235, 225, 200, 255))
    return im

def batu_base(d, vein=None):
    for (x, y, r, c) in [(32, 34, 22, (128, 128, 128, 255)), (22, 26, 12, (150, 150, 150, 255)),
                         (44, 40, 11, (110, 110, 110, 255))]:
        d.ellipse([x - r, y - r, x + r, y + r], fill=c)
    if vein:
        for (x, y, w, h) in [(24, 28, 12, 4), (34, 38, 10, 4), (28, 44, 8, 3)]:
            R(d, x, y, w, h, vein)

def singkapan_batu():
    im = img(64)
    d = ImageDraw.Draw(im)
    batu_base(d)
    return im

def urat_emas():
    im = img(64)
    d = ImageDraw.Draw(im)
    batu_base(d, vein=(240, 200, 60, 255))
    return im

def urat_besi():
    im = img(64)
    d = ImageDraw.Draw(im)
    batu_base(d, vein=(70, 80, 95, 255))
    return im

# ---------- api unggun 64 ----------
def api_unggun():
    im = img(64)
    d = ImageDraw.Draw(im)
    for (x, y) in [(20, 44), (30, 48), (40, 44), (24, 36), (38, 36), (44, 40), (18, 40)]:
        d.ellipse([x - 5, y - 5, x + 5, y + 5], fill=(130, 130, 130, 255))
    R(d, 24, 36, 16, 4, (101, 67, 50, 255))
    R(d, 24, 42, 16, 4, (90, 58, 42, 255))
    for (x, y, r, c) in [(32, 30, 12, (230, 110, 30, 255)), (32, 32, 8, (250, 180, 50, 255)), (32, 34, 4, (255, 230, 130, 255))]:
        d.ellipse([x - r, y - r, x + r, y + r], fill=c)
    return im

# ---------- bangunan 2x2 (128) ----------
def gubuk():
    im = img(128)
    d = ImageDraw.Draw(im)
    d.ellipse([8, 8, 120, 120], fill=(150, 110, 55, 255))          # dinding tanah
    d.ellipse([16, 16, 112, 112], fill=(190, 155, 75, 255))        # atap jerami
    d.ellipse([28, 28, 100, 100], fill=(205, 170, 90, 255))
    d.ellipse([44, 44, 84, 84], fill=(175, 140, 70, 255))
    R(d, 56, 100, 16, 16, (60, 40, 25, 255))                      # pintu (selatan)
    speckle(d, 128, [(220, 185, 105, 255)], 60, 66)
    return im

def tenda_kulit():
    im = img(128)
    d = ImageDraw.Draw(im)
    d.polygon([(64, 12), (16, 108), (112, 108)], fill=(165, 125, 80, 255))
    d.polygon([(64, 12), (40, 108), (88, 108)], fill=(185, 145, 95, 255))
    R(d, 60, 4, 8, 16, (90, 60, 35, 255))                          # tiang atas
    R(d, 56, 100, 16, 12, (60, 40, 25, 255))                       # pintu
    for x in (32, 64, 96):
        R(d, x, 40, 3, 3, (90, 60, 35, 255))
    return im

def lumbung():
    im = img(128)
    d = ImageDraw.Draw(im)
    for (x, y) in [(28, 28), (92, 28), (28, 92), (92, 92)]:
        R(d, x, y, 10, 10, (90, 60, 35, 255))                      # tiang panggung
    R(d, 20, 20, 88, 88, (150, 110, 55, 255))
    R(d, 28, 28, 72, 72, (175, 135, 70, 255))
    R(d, 36, 36, 56, 56, (190, 155, 85, 255))
    R(d, 52, 52, 24, 24, (160, 125, 60, 255))
    return im

def bengkel_batu():
    im = img(128)
    d = ImageDraw.Draw(im)
    R(d, 16, 16, 96, 96, (140, 135, 125, 255))
    d.ellipse([32, 32, 96, 96], fill=(120, 120, 120, 255))
    d.ellipse([44, 44, 84, 84], fill=(100, 100, 100, 255))
    R(d, 56, 40, 16, 10, (70, 70, 75, 255))                         # landasan
    R(d, 30, 88, 20, 6, (90, 60, 35, 255))                          # gagang perkakas
    R(d, 80, 30, 14, 14, (150, 150, 150, 255))                      # batu kerja
    return im

def pondok_tabib():
    im = img(128)
    d = ImageDraw.Draw(im)
    d.ellipse([12, 12, 116, 116], fill=(140, 105, 55, 255))
    d.ellipse([22, 22, 106, 106], fill=(170, 135, 75, 255))
    for (x, y) in [(36, 36), (88, 40), (40, 88), (86, 86), (64, 30)]:
        for dx, dy in ((0, 0), (6, 3), (-4, 5)):
            d.ellipse([x + dx - 4, y + dy - 4, x + dx + 4, y + dy + 4], fill=(70, 140, 70, 255))
    R(d, 56, 100, 16, 14, (60, 40, 25, 255))
    return im

# ---------- resource icons 48 ----------
def icon(fn, draw):
    im = img(48)
    d = ImageDraw.Draw(im)
    draw(d)
    im.save(os.path.join(ICONS, fn))

def ic_kayu(d):
    R(d, 8, 18, 32, 12, (139, 90, 43, 255))
    R(d, 8, 18, 32, 4, (160, 105, 55, 255))
    d.ellipse([36, 18, 44, 30], fill=(205, 170, 130, 255))

def ic_batu(d):
    d.ellipse([8, 14, 40, 38], fill=(130, 130, 130, 255))
    d.ellipse([16, 20, 30, 32], fill=(155, 155, 155, 255))

def ic_emas(d):
    d.ellipse([10, 16, 38, 36], fill=(240, 200, 60, 255))
    d.ellipse([16, 20, 28, 30], fill=(255, 225, 120, 255))

def ic_besi(d):
    d.polygon([(10, 36), (16, 14), (30, 10), (38, 26), (30, 38)], fill=(80, 90, 105, 255))
    d.polygon([(16, 14), (30, 10), (30, 26), (18, 28)], fill=(110, 125, 145, 255))

def ic_pangan(d):
    d.ellipse([10, 12, 32, 32], fill=(190, 70, 60, 255))
    R(d, 28, 20, 12, 5, (235, 225, 200, 255))
    R(d, 28, 27, 12, 5, (235, 225, 200, 255))

def ic_kulit(d):
    d.polygon([(12, 8), (36, 8), (40, 26), (32, 40), (16, 40), (8, 26)], fill=(190, 150, 95, 255))
    d.polygon([(18, 14), (30, 14), (32, 24), (24, 32), (16, 24)], fill=(210, 170, 110, 255))

TILES = {
    "rumput.png": rumput, "tanah.png": tanah, "air.png": air,
    "pohon.png": pohon, "semak-beri.png": semak_beri, "padang-buruan.png": padang_buruan,
    "singkapan-batu.png": singkapan_batu, "urat-emas.png": urat_emas, "urat-besi.png": urat_besi,
    "api-unggun.png": api_unggun,
    "gubuk.png": gubuk, "tenda-kulit.png": tenda_kulit, "lumbung.png": lumbung,
    "bengkel-batu.png": bengkel_batu, "pondok-tabib.png": pondok_tabib,
}
for fn, f in TILES.items():
    f().save(os.path.join(OUT, fn))
    print("wrote", fn)
for fn, f in [("kayu.png", ic_kayu), ("batu.png", ic_batu), ("emas.png", ic_emas),
              ("besi.png", ic_besi), ("pangan.png", ic_pangan), ("kulit.png", ic_kulit)]:
    icon(fn, f)
    print("wrote icons/" + fn)
print("done")
