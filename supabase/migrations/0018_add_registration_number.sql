-- Add registration_number to motorcycles table
ALTER TABLE public.motorcycles ADD COLUMN registration_number text;

-- Backfill existing motorcycles with registration numbers
UPDATE public.motorcycles SET registration_number = 'RI 46495' WHERE color = 'White' AND brand = 'Yamaha';
UPDATE public.motorcycles SET registration_number = 'RI 50272' WHERE color = 'Pink' AND brand = 'Genesis';
UPDATE public.motorcycles SET registration_number = 'RI 50273' WHERE color = 'Blue' AND brand = 'Genesis';
