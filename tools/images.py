"""Resize + convert the original photos into SEO-named WebP files.
Run:  python tools/images.py   (from repo root)
"""
import glob, os, json
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, '_originals')
OUT = os.path.join(ROOT, 'assets', 'img')
os.makedirs(OUT, exist_ok=True)

files = sorted(glob.glob(os.path.join(SRC, '*.jpg')))

# index in sorted list -> (slug, alt text, category)
MAP = {
 0: ('interior-laundry-room-painting-springfield-mo', 'Freshly painted laundry room with gray walls and white trim', 'interior'),
 1: ('mudroom-interior-painting-springfield-mo', 'Mudroom repaint with crisp walls beside a built-in wood bench', 'interior'),
 2: ('bedroom-repaint-new-construction-springfield-mo', 'Bedroom painted in a soft greige in a new-construction home', 'interior'),
 3: ('bathroom-painting-granite-vanity-springfield-mo', 'Bathroom walls painted around a granite vanity', 'interior'),
 5: ('vaulted-living-room-painting-springfield-mo', 'Vaulted living room with fireplace, freshly painted', 'interior'),
 6: ('interior-prep-floor-protection-springfield-mo', 'Floors fully covered with protective paper before interior painting', 'prep'),
 7: ('window-masking-prep-before-painting', 'Windows and trim masked in plastic before spraying', 'prep'),
 10: ('floor-protection-plastic-before-painting', 'Room floor wrapped in plastic sheeting before painting', 'prep'),
 15: ('ceiling-painting-stone-fireplace-living-room', 'Living room ceiling repainted above a stone fireplace', 'interior'),
 16: ('commercial-office-repaint-in-progress-springfield-mo', 'AGM painter cutting in a commercial office wall', 'commercial'),
 17: ('commercial-office-wall-primer-springfield-mo', 'Office walls primed over dark purple and olive paint', 'commercial'),
 18: ('commercial-office-painting-finished-springfield-mo', 'Finished commercial office wall with new paint', 'commercial'),
 19: ('retail-storefront-interior-painting-springfield-mo', 'Storefront interior walls painted a warm tan', 'commercial'),
 22: ('hallway-painting-springfield-mo', 'Bright painted hallway with recessed lighting', 'interior'),
 24: ('teal-accent-wall-bedroom-painting', 'Bedroom painted in a deep teal with a textured white ceiling', 'interior'),
 25: ('gray-lap-siding-exterior-painting-springfield-mo', 'Gray lap siding and white trim after exterior painting', 'exterior'),
 26: ('exterior-house-painting-gray-siding-white-trim', 'House side repainted in gray with white window trim', 'exterior'),
 27: ('basement-black-exposed-ceiling-painting', 'Basement with a black-painted exposed ceiling and white walls', 'basement'),
 28: ('painter-prepping-bedroom-springfield-mo', 'Painter prepping a bedroom for a fresh coat', 'interior'),
 29: ('ranch-home-exterior-painting-springfield-mo', 'Ranch home exterior repainted in gray', 'exterior'),
 30: ('home-gym-basement-black-ceiling-painting', 'Home gym basement with black dryfall ceiling and white walls', 'basement'),
 31: ('blue-accent-wall-bedroom-painting', 'Bedroom with a blue accent wall painted', 'interior'),
 32: ('white-bedroom-interior-painting-springfield-mo', 'Bright white bedroom after an interior repaint', 'interior'),
 33: ('shiplap-wall-painting-white', 'White painted shiplap wall with clean lines', 'interior'),
 35: ('garage-before-peeling-paint-springfield-mo', 'Before: garage with failing, peeling green paint', 'exterior'),
 36: ('white-painted-brick-home-porch-springfield-mo', 'White-painted brick home with porch railings', 'exterior'),
 37: ('garage-after-exterior-painting-springfield-mo', 'After: garage scraped, primed and painted gray with white trim', 'exterior'),
 38: ('bedroom-repaint-white-doors-trim', 'Bedroom repaint with white doors and trim', 'interior'),
 39: ('brick-home-trim-painting-springfield-mo', 'Brick home exterior trim painting with ladder setup', 'exterior'),
 41: ('navy-accent-wall-bedroom-springfield-mo', 'Bedroom with a navy accent wall', 'interior'),
 42: ('ranch-house-before-exterior-painting', 'Before: green ranch home siding before exterior painting', 'exterior'),
 43: ('hallway-walls-trim-painting', 'Long hallway with freshly painted walls and trim', 'interior'),
 44: ('ranch-house-after-exterior-painting-gray', 'After: ranch home repainted charcoal gray with white trim', 'exterior'),
 48: ('basement-exposed-ceiling-black-paint-springfield-mo', 'Finished basement with spray-painted black exposed ceiling', 'basement'),
 49: ('gray-siding-exterior-repaint', 'Gray exterior siding and window trim painting', 'exterior'),
 50: ('front-door-painting-gray-brick-home', 'Gray painted front door on a brick home', 'doors'),
 52: ('basement-laundry-black-ceiling-painting', 'Basement laundry area with black painted ceiling', 'basement'),
 53: ('entry-door-painting-springfield-mo', 'Entry door painted a soft gray', 'doors'),
 55: ('bathroom-repaint-white-trim', 'Bathroom and adjoining rooms repainted with white trim', 'interior'),
 56: ('soffit-porch-ceiling-painting', 'Painted porch soffit ceiling between brick walls', 'exterior'),
 57: ('shed-painting-before-springfield-mo', 'Barn-style shed during exterior painting', 'exterior'),
 58: ('tray-ceiling-bedroom-painting', 'Bedroom with tray ceiling freshly painted', 'interior'),
 59: ('bedroom-interior-painting-nixa-mo', 'Bedroom with clean white walls after painting', 'interior'),
 61: ('commercial-wall-repair-prep-before', 'Before: damaged commercial wall being repaired and prepped', 'commercial'),
 62: ('green-house-before-exterior-painting', 'Before: green siding and red door before repaint', 'exterior'),
 63: ('commercial-office-wainscot-after-painting', 'After: commercial office wall repaired and repainted', 'commercial'),
 65: ('interior-hallway-to-living-room-painting', 'Hallway opening to a freshly painted living room', 'interior'),
 66: ('commercial-lobby-painting-springfield-mo', 'Commercial lobby with storefront windows during repaint', 'commercial'),
 67: ('commercial-office-repaint-finished', 'Finished commercial office repaint with wainscot', 'commercial'),
 69: ('garage-door-painting-blue-gray-springfield-mo', 'Garage door painted a blue-gray on a brick home', 'doors'),
 70: ('shed-exterior-painting-springfield-mo', 'Shed exterior painted white with dark trim', 'exterior'),
 71: ('bedroom-painting-closet-doors-trim', 'Bedroom repaint with white closet doors and trim', 'interior'),
 72: ('bathroom-painting-springfield-mo', 'Bathroom repainted with white walls and trim', 'interior'),
 73: ('barn-shed-painting-white-gray-trim', 'Barn-style shed painted white with gray trim', 'exterior'),
 74: ('shed-painting-ozark-mo', 'Finished shed painting with gray trim and door', 'exterior'),
 75: ('painter-rolling-ceiling-springfield-mo', 'AGM painter rolling a ceiling with an extension pole', 'interior'),
 76: ('red-cedar-home-staining-springfield-mo', 'Cedar home exterior stained a rich barn red', 'staining'),
 77: ('log-home-exterior-stain-missouri', 'Rural home with freshly stained red siding', 'staining'),
 78: ('agm-painting-crew-exterior-staining-job', 'AGM Painting crew on an exterior staining job', 'staining'),
 79: ('stained-cedar-garage-exterior-springfield-mo', 'Cedar-sided garage freshly stained red with black trim', 'staining'),
 80: ('red-stained-home-wooded-lot-springfield-mo', 'Stained red home on a wooded lot', 'staining'),
 81: ('a-frame-cedar-siding-stain', 'A-frame gable with freshly stained cedar siding', 'staining'),
 82: ('cedar-siding-staining-exterior', 'Side of home with stained cedar siding and trim', 'staining'),
 83: ('rough-sawn-cedar-siding-stain-springfield-mo', 'Rough-sawn vertical cedar siding after staining', 'staining'),
 84: ('vertical-wood-siding-staining', 'Vertical wood siding restained a deep brown', 'staining'),
 85: ('stone-home-garage-doors-stained-springfield-mo', 'Stone home with three stained wood garage doors', 'doors'),
 86: ('painter-staining-wood-siding-ladder', 'Painter staining wood siding from a ladder', 'staining'),
}

manifest = {}
for i, f in enumerate(files):
    if i not in MAP:
        continue
    slug, alt, cat = MAP[i]
    im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
    w, h = im.size
    sizes = {}
    for tw in (1600, 800):
        if w < tw and tw != 800:
            tw = w
        r = im.copy()
        r.thumbnail((tw, tw * 4))
        name = f'{slug}-{1600 if tw > 800 else 800}.webp'
        r.save(os.path.join(OUT, name), 'WEBP', quality=72, method=6)
        sizes[tw] = name
    # jpg for social sharing
    og = im.copy(); og.thumbnail((1200, 1200))
    og.save(os.path.join(OUT, f'{slug}.jpg'), 'JPEG', quality=78, optimize=True, progressive=True)
    manifest[slug] = {'alt': alt, 'cat': cat, 'w': w, 'h': h, 'idx': i}

with open(os.path.join(OUT, 'manifest.json'), 'w') as fh:
    json.dump(manifest, fh, indent=1)

# Logo: knock out the navy background into a transparent white mark
logo = Image.open(os.path.join(SRC, 'new.png')).convert('RGBA')
px = logo.load()
lw, lh = logo.size
for y in range(lh):
    for x in range(lw):
        r, g, b, a = px[x, y]
        lum = (r + g + b) / 3
        alpha = max(0, min(255, int((lum - 60) * 255 / (235 - 60))))
        px[x, y] = (255, 255, 255, alpha)
bbox = logo.getbbox()
mark = logo.crop(bbox)
mark.thumbnail((600, 600))
mark.save(os.path.join(OUT, 'agm-painting-logo-white.png'), optimize=True)
mark.save(os.path.join(OUT, 'agm-painting-logo-white.webp'), 'WEBP', quality=90)

full = Image.open(os.path.join(SRC, 'new.png')).convert('RGB')
for s in (512, 192, 180, 32):
    full.resize((s, s), Image.LANCZOS).save(os.path.join(ROOT, 'assets', f'icon-{s}.png'), optimize=True)
full.resize((600, 600), Image.LANCZOS).save(os.path.join(OUT, 'agm-painting-logo.jpg'), quality=85)
print('done', len(manifest), 'images', mark.size)
