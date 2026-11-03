#!/usr/bin/env python3
"""Sprite panel bangunan ronde 4 (PIL, prosedural dari 0, transparan).
Mengisi 8 sprite bangunan lama yang belum ada file-nya (pagar, rak-jemur,
lingkaran-batu, totem, ladang, bengkel-kayu, jembatan, perahu) + 7 sprite
bangunan baru (gubuk-besar, tenda-besar, balai, dapur-umum, menara-jaga,
sumur-batu, gapura). 128x128 RGBA, palet tanah — gaya sama generate-sprites.py.
Output: public/batu/<nama>.png (hanya yang belum ada, tidak menimpa).
"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.expanduser("~/workspace/negaraemas-feedback3")
OUT = os.path.join(ROOT, "public", "batu")
os.makedirs(OUT, exist_ok=True)

def img():
    return Image.new("RGBA", (128, 128), (0, 0, 0, 0))

def R(d, x, y, w, h, c):
    d.rectangle([x, y, x + w - 1, y + h - 1], fill=c)

def T(d, cx, y, w, h, c):
    d.polygon([(cx - w // 2, y + h), (cx + w // 2, y + h), (cx, y)], fill=c)

WOOD = (138, 90, 51, 255)
WOOD_D = (107, 66, 38, 255)
THATCH = (201, 168, 106, 255)
LEATHER = (185, 138, 94, 255)
STONE = (141, 141, 141, 255)
STONE_D = (109, 109, 109, 255)
GREEN = (46, 125, 50, 255)
FIRE = (255, 122, 26, 255)

def pagar():
    im = img()
    d = ImageDraw.Draw(im)
    for x in (14, 38, 62, 86, 108):
        R(d, x, 30, 8, 70, WOOD)
    R(d, 10, 40, 108, 8, WOOD_D)
    R(d, 10, 78, 108, 8, WOOD_D)
    return im

def rak_jemur():
    im = img()
    d = ImageDraw.Draw(im)
    R(d, 30, 20, 8, 90, WOOD)
    R(d, 90, 20, 8, 90, WOOD)
    R(d, 22, 30, 84, 8, WOOD_D)
    for x in (34, 56, 78):
        R(d, x, 44, 18, 26, (146, 64, 14, 255))
    return im

def lingkaran_batu():
    im = img()
    d = ImageDraw.Draw(im)
    import math
    for i in range(8):
        a = i / 8 * 2 * math.pi
        x, y = int(64 + math.cos(a) * 42), int(64 + math.sin(a) * 42)
        d.ellipse([x - 12, y - 12, x + 12, y + 12], fill=STONE, outline=STONE_D)
    d.ellipse([52, 52, 76, 76], fill=FIRE)
    return im

def totem():
    im = img()
    d = ImageDraw.Draw(im)
    R(d, 52, 14, 24, 100, WOOD)
    R(d, 56, 24, 16, 12, (250, 204, 21, 255))
    R(d, 56, 48, 16, 12, (185, 28, 28, 255))
    T(d, 64, 2, 28, 12, GREEN)
    return im

def ladang():
    im = img()
    d = ImageDraw.Draw(im)
    R(d, 10, 30, 108, 70, (107, 66, 38, 255))
    for y in (36, 54, 72, 90):
        R(d, 14, y, 100, 10, GREEN)
        for x in range(20, 110, 18):
            R(d, x, y - 4, 4, 18, (58, 150, 62, 255))
    return im

def bengkel_kayu():
    im = img()
    d = ImageDraw.Draw(im)
    R(d, 18, 40, 92, 60, WOOD)
    T(d, 64, 10, 108, 30, THATCH)
    for i, y in enumerate((106, 112, 118)):
        d.ellipse([44, y - 6, 84, y + 6], fill=WOOD_D)
    return im

def jembatan():
    im = img()
    d = ImageDraw.Draw(im)
    R(d, 10, 50, 108, 28, (166, 124, 82, 255))
    for x in (16, 40, 64, 88):
        R(d, x, 44, 4, 40, WOOD_D)
    R(d, 10, 40, 108, 5, WOOD)
    R(d, 10, 80, 108, 5, WOOD)
    R(d, 10, 90, 108, 12, (56, 189, 248, 255))
    return im

def perahu():
    im = img()
    d = ImageDraw.Draw(im)
    d.polygon([(14, 84), (114, 84), (96, 108), (32, 108)], fill=WOOD)
    R(d, 60, 20, 6, 64, WOOD_D)
    d.polygon([(66, 26), (66, 62), (100, 62)], fill=(253, 246, 227, 255))
    R(d, 10, 108, 108, 10, (56, 189, 248, 255))
    return im

def gubuk_besar():
    im = img()
    d = ImageDraw.Draw(im)
    R(d, 14, 52, 100, 62, WOOD)
    T(d, 64, 14, 116, 40, THATCH)
    R(d, 40, 84, 14, 30, (62, 39, 35, 255))
    R(d, 76, 84, 14, 30, (62, 39, 35, 255))
    return im

def tenda_besar():
    im = img()
    d = ImageDraw.Draw(im)
    d.polygon([(14, 110), (114, 110), (64, 16)], fill=LEATHER)
    R(d, 60, 10, 8, 104, WOOD_D)
    d.polygon([(58, 110), (70, 110), (64, 96)], fill=(62, 39, 35, 255))
    return im

def balai():
    im = img()
    d = ImageDraw.Draw(im)
    for x in (18, 102):
        R(d, x, 30, 10, 80, WOOD)
    R(d, 10, 22, 108, 12, THATCH)
    R(d, 34, 96, 60, 14, WOOD_D)
    return im

def dapur_umum():
    im = img()
    d = ImageDraw.Draw(im)
    R(d, 18, 44, 92, 62, WOOD)
    T(d, 64, 14, 108, 30, THATCH)
    d.ellipse([48, 88, 80, 108], fill=(74, 74, 74, 255))
    T(d, 64, 78, 18, 14, FIRE)
    return im

def menara_jaga():
    im = img()
    d = ImageDraw.Draw(im)
    for x in (38, 82):
        R(d, x, 40, 8, 72, WOOD)
    R(d, 30, 26, 68, 14, WOOD_D)
    T(d, 64, 4, 80, 22, THATCH)
    R(d, 30, 40, 68, 4, WOOD_D)
    return im

def sumur_batu():
    im = img()
    d = ImageDraw.Draw(im)
    d.ellipse([34, 62, 94, 110], fill=STONE, outline=STONE_D)
    d.ellipse([44, 72, 84, 96], fill=(56, 189, 248, 255))
    R(d, 30, 20, 8, 60, WOOD)
    R(d, 90, 20, 8, 60, WOOD)
    R(d, 22, 14, 84, 10, THATCH)
    return im

def gapura():
    im = img()
    d = ImageDraw.Draw(im)
    R(d, 22, 30, 14, 84, WOOD)
    R(d, 92, 30, 14, 84, WOOD)
    R(d, 14, 22, 100, 12, WOOD_D)
    T(d, 64, 4, 60, 18, THATCH)
    return im

SPECS = {
    "pagar": pagar, "rak-jemur": rak_jemur, "lingkaran-batu": lingkaran_batu,
    "totem": totem, "ladang": ladang, "bengkel-kayu": bengkel_kayu,
    "jembatan": jembatan, "perahu": perahu, "gubuk-besar": gubuk_besar,
    "tenda-besar": tenda_besar, "balai": balai, "dapur-umum": dapur_umum,
    "menara-jaga": menara_jaga, "sumur-batu": sumur_batu, "gapura": gapura,
}
for nama, fn in SPECS.items():
    path = os.path.join(OUT, f"{nama}.png")
    if os.path.exists(path):
        print(f"lewati (sudah ada): {nama}.png")
        continue
    fn().save(path)
    print(f"dibuat: {nama}.png ({os.path.getsize(path)} byte)")
