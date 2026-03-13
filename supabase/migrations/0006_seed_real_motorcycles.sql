-- M6-5: Seed real motorcycle catalog

-- Deactivate all existing placeholder motorcycles
UPDATE public.motorcycles SET is_active = false;

-- Insert real motorcycles
INSERT INTO public.motorcycles (name, slug, brand, model, color, transmission, daily_rate, year, image_url, is_active)
VALUES
  ('Yamaha XT 125', 'yamaha-xt-125-white', 'Yamaha', 'XT 125', 'White', 'Manual', 20.00, NULL, NULL, true),
  ('Blue Genesis Click', 'blue-genesis-click', 'Genesis', 'Click', 'Blue', 'Automatic', 20.00, NULL, NULL, true),
  ('Pink Genesis Click', 'pink-genesis-click', 'Genesis', 'Click', 'Pink', 'Automatic', 20.00, NULL, NULL, true);
