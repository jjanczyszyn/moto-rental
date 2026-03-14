-- WO-006: Fix motorcycle names (Click→Klik, XT 125→XTZ 125) and replace images with real product photos

-- Yamaha: XT 125 → XTZ 125, update image to webp
UPDATE public.motorcycles
SET name = 'Yamaha XTZ 125',
    slug = 'yamaha-xtz-125-white',
    model = 'XTZ 125',
    image_url = '/images/yamaha-xtz-125-white.webp'
WHERE slug = 'yamaha-xt-125-white';

-- Blue Genesis: Click → Klik, update image to webp
UPDATE public.motorcycles
SET name = 'Blue Genesis Klik',
    slug = 'genesis-klik-blue',
    model = 'Klik',
    image_url = '/images/genesis-klik-blue.webp'
WHERE slug = 'blue-genesis-click';

-- Pink Genesis: Click → Klik, update image to webp
UPDATE public.motorcycles
SET name = 'Pink Genesis Klik',
    slug = 'genesis-klik-pink',
    model = 'Klik',
    image_url = '/images/genesis-klik-pink.webp'
WHERE slug = 'pink-genesis-click';
