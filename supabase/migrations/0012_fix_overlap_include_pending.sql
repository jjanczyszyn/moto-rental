-- WO-007: Include 'pending' bookings in server-side overlap check
-- Without this, two customers could submit overlapping pending bookings simultaneously

CREATE OR REPLACE FUNCTION public.create_booking_request(
  p_motorcycle_id uuid,
  p_customer_name text,
  p_customer_email text DEFAULT NULL,
  p_customer_whatsapp text DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_daily_rate_usd numeric DEFAULT 20.00,
  p_monthly_rate_usd numeric DEFAULT 400.00,
  p_weekly_discount_pct numeric DEFAULT 10,
  p_biweekly_discount_pct numeric DEFAULT 18,
  p_security_deposit_usd numeric DEFAULT 100.00,
  p_delivery_date_time text DEFAULT NULL,
  p_delivery_map_link text DEFAULT NULL,
  p_delivery_location_description text DEFAULT NULL,
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

  -- Check for overlapping bookings (now includes pending)
  SELECT COUNT(*) INTO v_overlap_count
  FROM public.bookings
  WHERE motorcycle_id = p_motorcycle_id
    AND status IN ('approved', 'active', 'pending')
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

  -- Generate reservation code
  v_reservation_code := upper(substr(md5(random()::text), 1, 8));

  -- Generate access secret
  v_access_secret := encode(gen_random_bytes(16), 'hex');
  v_access_secret_hash := encode(digest(v_access_secret, 'sha256'), 'hex');

  -- Insert booking
  INSERT INTO public.bookings (
    motorcycle_id, customer_name, customer_email, customer_whatsapp,
    start_date, end_date, status, payment_method,
    base_price_usd, discount_usd, rental_total_usd,
    security_deposit_usd, total_due_usd, rental_days,
    reservation_code, customer_access_secret_hash,
    delivery_date_time, delivery_map_link, delivery_location_description,
    typed_signature_name, drawn_signature_data, contract_signed_at, contract_text,
    delivery_status
  ) VALUES (
    p_motorcycle_id, p_customer_name, p_customer_email, p_customer_whatsapp,
    p_start_date, p_end_date, 'pending', p_payment_method,
    v_base_price, v_discount_usd, v_rental_total,
    p_security_deposit_usd, v_total_due, v_rental_days,
    v_reservation_code, v_access_secret_hash,
    p_delivery_date_time, p_delivery_map_link, p_delivery_location_description,
    p_typed_signature_name, p_drawn_signature_data, p_contract_signed_at, p_contract_text,
    'scheduled'
  )
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object(
    'booking_id', v_booking_id,
    'reservation_code', v_reservation_code,
    'customer_access_secret', v_access_secret
  );
END;
$$;
