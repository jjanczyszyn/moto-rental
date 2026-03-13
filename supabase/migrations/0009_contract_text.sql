-- M9-3: Add contract_text column to store the full contract at time of signing
ALTER TABLE public.bookings ADD COLUMN contract_text text;

-- Update RPC to accept and store contract_text
CREATE OR REPLACE FUNCTION public.create_booking_request(
  -- Core booking fields
  p_motorcycle_id uuid,
  p_start_date date,
  p_end_date date,
  p_customer_name text,
  p_customer_whatsapp text DEFAULT NULL,
  p_customer_email text DEFAULT NULL,

  -- Pricing parameters (from frontend config)
  p_daily_rate_usd numeric DEFAULT 20.00,
  p_weekly_discount_pct numeric DEFAULT 10,
  p_biweekly_discount_pct numeric DEFAULT 18,
  p_monthly_rate_usd numeric DEFAULT 400.00,
  p_security_deposit_usd numeric DEFAULT 100.00,

  -- Payment
  p_payment_method text DEFAULT NULL,

  -- Delivery
  p_delivery_date_time timestamptz DEFAULT NULL,
  p_delivery_map_link text DEFAULT NULL,
  p_delivery_location_description text DEFAULT NULL,

  -- Contract
  p_typed_signature_name text DEFAULT NULL,
  p_drawn_signature_data text DEFAULT NULL,
  p_contract_signed_at timestamptz DEFAULT NULL,
  p_contract_text text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rental_days integer;
  v_base_price numeric(10,2);
  v_rental_total numeric(10,2);
  v_discount_usd numeric(10,2);
  v_total_due numeric(10,2);
  v_full_months integer;
  v_remaining_days integer;
  v_option_a numeric(10,2);
  v_option_b numeric(10,2);
  v_reservation_code text;
  v_booking_id uuid;
  v_access_secret text;
  v_access_secret_hash text;
  v_overlap_count integer;
BEGIN
  -- Validate motorcycle exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.motorcycles
    WHERE id = p_motorcycle_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Motorcycle not found or not active';
  END IF;

  -- Validate date range
  IF p_start_date >= p_end_date THEN
    RAISE EXCEPTION 'start_date must be before end_date';
  END IF;

  IF p_start_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'start_date cannot be in the past';
  END IF;

  -- Check for overlapping bookings
  SELECT COUNT(*) INTO v_overlap_count
  FROM public.bookings
  WHERE motorcycle_id = p_motorcycle_id
    AND status IN ('approved', 'active')
    AND start_date < p_end_date
    AND end_date > p_start_date;

  IF v_overlap_count > 0 THEN
    RAISE EXCEPTION 'Motorcycle is not available for the selected dates';
  END IF;

  -- Calculate rental days
  v_rental_days := p_end_date - p_start_date;

  -- Calculate pricing (4-tier logic)
  IF v_rental_days >= 28 THEN
    v_full_months := floor(v_rental_days / 30);
    v_remaining_days := v_rental_days - (v_full_months * 30);
    v_option_a := (v_full_months * p_monthly_rate_usd) +
                  (v_remaining_days * p_daily_rate_usd * (1 - p_biweekly_discount_pct / 100));
    v_option_b := v_rental_days * p_daily_rate_usd * (1 - p_biweekly_discount_pct / 100);
    v_base_price := v_rental_days * p_daily_rate_usd;
    v_rental_total := LEAST(v_option_a, v_option_b);
  ELSIF v_rental_days >= 14 THEN
    v_base_price := v_rental_days * p_daily_rate_usd;
    v_rental_total := v_base_price * (1 - p_biweekly_discount_pct / 100);
  ELSIF v_rental_days >= 7 THEN
    v_base_price := v_rental_days * p_daily_rate_usd;
    v_rental_total := v_base_price * (1 - p_weekly_discount_pct / 100);
  ELSE
    v_base_price := v_rental_days * p_daily_rate_usd;
    v_rental_total := v_base_price;
  END IF;

  v_discount_usd := v_base_price - v_rental_total;
  v_total_due := v_rental_total + p_security_deposit_usd;

  -- Generate reservation code (8-char uppercase alphanumeric)
  v_reservation_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

  -- Generate customer access secret
  v_access_secret := encode(gen_random_bytes(16), 'hex');
  v_access_secret_hash := encode(sha256(v_access_secret::bytea), 'hex');

  -- Generate booking ID
  v_booking_id := gen_random_uuid();

  -- Insert booking
  INSERT INTO public.bookings (
    id,
    motorcycle_id,
    start_date,
    end_date,
    customer_name,
    customer_whatsapp,
    customer_email,
    status,
    reservation_code,
    rental_days,
    base_price_usd,
    discount_usd,
    rental_total_usd,
    security_deposit_usd,
    total_due_usd,
    payment_method,
    payment_status,
    delivery_date_time,
    delivery_map_link,
    delivery_location_description,
    delivery_status,
    typed_signature_name,
    drawn_signature_data,
    contract_signed_at,
    customer_access_secret_hash,
    contract_text
  ) VALUES (
    v_booking_id,
    p_motorcycle_id,
    p_start_date,
    p_end_date,
    p_customer_name,
    p_customer_whatsapp,
    p_customer_email,
    'pending',
    v_reservation_code,
    v_rental_days,
    v_base_price,
    v_discount_usd,
    v_rental_total,
    p_security_deposit_usd,
    v_total_due,
    p_payment_method,
    'unpaid',
    p_delivery_date_time,
    p_delivery_map_link,
    p_delivery_location_description,
    'pending',
    p_typed_signature_name,
    p_drawn_signature_data,
    p_contract_signed_at,
    v_access_secret_hash,
    p_contract_text
  );

  -- Return result
  RETURN jsonb_build_object(
    'reservation_code', v_reservation_code,
    'booking_id', v_booking_id,
    'customer_access_secret', v_access_secret
  );
END;
$$;
