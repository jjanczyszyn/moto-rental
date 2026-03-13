-- M6-4: Customer lookup RPC + RLS verification
CREATE OR REPLACE FUNCTION public.lookup_booking(
  p_reservation_code text,
  p_access_secret text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_secret_hash text;
  v_result jsonb;
BEGIN
  -- Hash the provided secret
  v_secret_hash := encode(sha256(p_access_secret::bytea), 'hex');

  -- Look up booking by reservation code + secret hash, JOIN motorcycle
  SELECT jsonb_build_object(
    'booking_id', b.id,
    'reservation_code', b.reservation_code,
    'status', b.status,
    'start_date', b.start_date,
    'end_date', b.end_date,
    'customer_name', b.customer_name,
    'customer_email', b.customer_email,
    'customer_whatsapp', b.customer_whatsapp,
    'rental_days', b.rental_days,
    'base_price_usd', b.base_price_usd,
    'discount_usd', b.discount_usd,
    'rental_total_usd', b.rental_total_usd,
    'security_deposit_usd', b.security_deposit_usd,
    'total_due_usd', b.total_due_usd,
    'payment_method', b.payment_method,
    'payment_status', b.payment_status,
    'delivery_date_time', b.delivery_date_time,
    'delivery_map_link', b.delivery_map_link,
    'delivery_location_description', b.delivery_location_description,
    'delivery_status', b.delivery_status,
    'typed_signature_name', b.typed_signature_name,
    'contract_signed_at', b.contract_signed_at,
    'created_at', b.created_at,
    'motorcycle', jsonb_build_object(
      'name', m.name,
      'image_url', m.image_url,
      'color', m.color
    )
  )
  INTO v_result
  FROM public.bookings b
  JOIN public.motorcycles m ON m.id = b.motorcycle_id
  WHERE b.reservation_code = p_reservation_code
    AND b.customer_access_secret_hash = v_secret_hash;

  -- Invalid credentials
  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Invalid reservation code or access secret';
  END IF;

  RETURN v_result;
END;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.lookup_booking(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_booking(text, text) TO authenticated;
