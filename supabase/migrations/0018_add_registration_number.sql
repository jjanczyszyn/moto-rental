-- Add registration_number to motorcycles table
ALTER TABLE public.motorcycles ADD COLUMN registration_number text;

-- Backfill existing motorcycles with registration numbers
UPDATE public.motorcycles SET registration_number = 'RI 46495' WHERE id = '6578e6ff-7605-4902-badf-7c7202bc39b2';
UPDATE public.motorcycles SET registration_number = 'RI 50272' WHERE id = 'ca3b323b-85e3-403b-bc12-e91ac1119a48';
UPDATE public.motorcycles SET registration_number = 'RI 50273' WHERE id = '2fff695e-106f-496b-be0f-1f105a32f466';
