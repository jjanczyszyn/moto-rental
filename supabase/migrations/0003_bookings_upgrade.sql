-- M6-2: Add pricing, delivery, contract, and access columns to bookings

-- Pricing
ALTER TABLE public.bookings ADD COLUMN base_price_usd numeric(10,2);
ALTER TABLE public.bookings ADD COLUMN discount_usd numeric(10,2);
ALTER TABLE public.bookings ADD COLUMN rental_total_usd numeric(10,2);
ALTER TABLE public.bookings ADD COLUMN security_deposit_usd numeric(10,2);
ALTER TABLE public.bookings ADD COLUMN total_due_usd numeric(10,2);
ALTER TABLE public.bookings ADD COLUMN rental_days integer;

-- Payment
ALTER TABLE public.bookings ADD COLUMN payment_method text;
ALTER TABLE public.bookings ADD COLUMN payment_status text;

-- Delivery
ALTER TABLE public.bookings ADD COLUMN delivery_date_time timestamptz;
ALTER TABLE public.bookings ADD COLUMN delivery_map_link text;
ALTER TABLE public.bookings ADD COLUMN delivery_location_description text;
ALTER TABLE public.bookings ADD COLUMN delivery_status text;
ALTER TABLE public.bookings ADD COLUMN delivered_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN delivery_note text;

-- Contract
ALTER TABLE public.bookings ADD COLUMN typed_signature_name text;
ALTER TABLE public.bookings ADD COLUMN drawn_signature_data text;
ALTER TABLE public.bookings ADD COLUMN contract_signed_at timestamptz;

-- Access
ALTER TABLE public.bookings ADD COLUMN customer_access_secret_hash text;
