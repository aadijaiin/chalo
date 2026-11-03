"""Builds the Google Play listing graphics from the app's icon and real screenshots.

    python3 store/make-assets.py      # needs Pillow (pip install pillow) and app/node_modules

Writes store/android/: icon-512.png, feature-graphic.png and screenshots/*.png (1080x1920).
Play wants phone screenshots no more than 2:1, and a raw 20:9 capture is wider than that, so each
one is framed on a 9:16 card with a caption.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'store' / 'android'
FONTS = ROOT / 'app' / 'node_modules' / '@expo-google-fonts' / 'plus-jakarta-sans'

SAND = (250, 247, 242)
INK = (38, 33, 29)
MUTED = (122, 114, 107)
TERRACOTTA = (226, 114, 91)

SCREENS = [
    ('map', 'Everyone on one map', 'Live positions, routes and ETAs for the whole crew'),
    ('lookout', 'Let family follow along', 'Lookouts see the crew. Nobody sees them.'),
    ('lobby', 'Start a party in seconds', 'Share a code, set a destination, go'),
    ('recap', 'Relive the trip', 'Everyone’s route, distance and top speed'),
]


def font(weight: str, size: int):
    name = {'800': '800ExtraBold', '500': '500Medium'}[weight]
    return ImageFont.truetype(str(FONTS / name / f'PlusJakartaSans_{name}.ttf'), size)


def rounded(im: Image.Image, radius: int) -> Image.Image:
    mask = Image.new('L', im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *im.size), radius, fill=255)
    out = im.convert('RGBA')
    out.putalpha(mask)
    return out


def phone(shot: Image.Image, height: int) -> Image.Image:
    """The screenshot in a dark phone outline, with a soft shadow, on a transparent canvas."""
    border = round(height * 0.016)
    screen = shot.resize((round(shot.width * (height - 2 * border) / shot.height), height - 2 * border), Image.LANCZOS)
    body = Image.new('RGBA', (screen.width + 2 * border, height), (0, 0, 0, 0))
    ImageDraw.Draw(body).rounded_rectangle((0, 0, body.width, body.height), round(height * 0.06), fill=INK)
    body.alpha_composite(rounded(screen, round(height * 0.05)), (border, border))

    pad = 60
    canvas = Image.new('RGBA', (body.width + 2 * pad, body.height + 2 * pad), (0, 0, 0, 0))
    shadow = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        (pad, pad + 24, pad + body.width, pad + body.height + 24), round(height * 0.06), fill=(0, 0, 0, 70)
    )
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(28)))
    canvas.alpha_composite(body, (pad, pad))
    return canvas


def screenshot(name: str, title: str, subtitle: str):
    W, H = 1080, 1920
    card = Image.new('RGBA', (W, H), SAND + (255,))
    draw = ImageDraw.Draw(card)
    # A warm glow behind the phone, like the website.
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((W * 0.15, H * 0.35, W * 1.2, H * 1.15), fill=TERRACOTTA + (60,))
    card.alpha_composite(glow.filter(ImageFilter.GaussianBlur(120)))

    draw.text((W / 2, 150), title, font=font('800', 76), fill=INK, anchor='mm')
    draw.text((W / 2, 238), subtitle, font=font('500', 38), fill=MUTED, anchor='mm')

    shot = Image.open(ROOT / 'store' / 'source' / f'{name}.png').convert('RGB')
    framed = phone(shot, 1560)
    card.alpha_composite(framed, ((W - framed.width) // 2, 310))
    card.convert('RGB').save(OUT / 'screenshots' / f'{SCREENS.index((name, title, subtitle)) + 1:02d}-{name}.png')


def feature_graphic():
    W, H = 1024, 500
    card = Image.new('RGBA', (W, H), SAND + (255,))
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((560, -120, 1180, 560), fill=TERRACOTTA + (70,))
    card.alpha_composite(glow.filter(ImageFilter.GaussianBlur(90)))

    icon = Image.open(ROOT / 'app' / 'assets' / 'images' / 'icon.png').convert('RGBA').resize((112, 112), Image.LANCZOS)
    card.alpha_composite(rounded(icon, 26), (64, 92))
    draw = ImageDraw.Draw(card)
    draw.text((196, 148), 'chalo', font=font('800', 64), fill=INK, anchor='lm')
    draw.text((64, 270), 'Find your way,', font=font('800', 54), fill=INK, anchor='ls')
    draw.text((64, 336), 'together.', font=font('800', 54), fill=TERRACOTTA, anchor='ls')
    draw.text((64, 400), 'Live location for road trips and group rides', font=font('500', 24), fill=MUTED, anchor='ls')

    shot = Image.open(ROOT / 'store' / 'source' / 'map.png').convert('RGB')
    framed = phone(shot, 620)
    card.alpha_composite(framed, (W - framed.width + 10, 40))
    card.convert('RGB').save(OUT / 'feature-graphic.png')


def icon():
    im = Image.open(ROOT / 'app' / 'assets' / 'images' / 'icon.png').convert('RGBA')
    # Play wants a full-bleed 512 PNG (it rounds the corners itself) without transparency.
    flat = Image.new('RGBA', im.size, (255, 255, 255, 255))
    flat.alpha_composite(im)
    flat.convert('RGB').resize((512, 512), Image.LANCZOS).save(OUT / 'icon-512.png')


if __name__ == '__main__':
    (OUT / 'screenshots').mkdir(parents=True, exist_ok=True)
    icon()
    feature_graphic()
    for s in SCREENS:
        screenshot(*s)
    print('wrote', *sorted(p.relative_to(ROOT).as_posix() for p in OUT.rglob('*.png')), sep='\n  ')
