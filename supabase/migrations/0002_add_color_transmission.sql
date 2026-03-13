-- Add color and transmission columns to motorcycles
ALTER TABLE public.motorcycles ADD COLUMN color text;
ALTER TABLE public.motorcycles ADD COLUMN transmission text;

-- Backfill existing rows
UPDATE public.motorcycles SET color = 'Unknown', transmission = 'Unknown' WHERE color IS NULL;
