-- M6-7: Set motorcycle image URLs by slug
UPDATE public.motorcycles SET image_url = '/images/yamaha-xt-125-white.svg' WHERE slug = 'yamaha-xt-125-white';
UPDATE public.motorcycles SET image_url = '/images/blue-genesis-click.svg' WHERE slug = 'blue-genesis-click';
UPDATE public.motorcycles SET image_url = '/images/pink-genesis-click.svg' WHERE slug = 'pink-genesis-click';
