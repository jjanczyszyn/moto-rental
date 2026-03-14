-- Fix Yamaha image: was blue webp, now white jpg
UPDATE public.motorcycles
SET image_url = '/images/yamaha-xtz-125-white.jpg'
WHERE slug = 'yamaha-xtz-125-white';
