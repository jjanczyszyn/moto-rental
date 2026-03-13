-- M8-P1: Update motorcycle image URLs from SVG placeholders to real JPG photos
UPDATE public.motorcycles SET image_url = '/images/yamaha-xt-125-white.jpg' WHERE slug = 'yamaha-xt-125-white';
UPDATE public.motorcycles SET image_url = '/images/blue-genesis-click.jpg' WHERE slug = 'blue-genesis-click';
UPDATE public.motorcycles SET image_url = '/images/pink-genesis-click.jpg' WHERE slug = 'pink-genesis-click';
