import { supabase } from './lib/supabase';
import { MANAGER_WHATSAPP_LINK, REVIEW_LINK } from './lib/business-config';
import { sanitizeRpcParams } from './lib/rpc-params';

const main = document.getElementById('customer-main');
if (!main) throw new Error('Missing #customer-main element');

interface BookingData {
  booking_id: string;
  reservation_code: string;
  status: string;
  start_date: string;
  end_date: string;
  customer_name: string;
  customer_email: string | null;
  customer_whatsapp: string | null;
  rental_days: number;
  base_price_usd: number;
  discount_usd: number;
  rental_total_usd: number;
  security_deposit_usd: number;
  total_due_usd: number;
  payment_method: string | null;
  payment_status: string | null;
  delivery_date_time: string | null;
  delivery_map_link: string | null;
  delivery_location_description: string | null;
  delivery_status: string | null;
  typed_signature_name: string | null;
  contract_signed_at: string | null;
  created_at: string;
  motorcycle: {
    name: string;
    image_url: string | null;
    color: string | null;
  };
}

function renderLookupForm(): string {
  return `
    <div class="customer-lookup-form">
      <h2>Check Your Reservation</h2>
      <p>Enter your reservation code and access secret to view your booking details.</p>
      <div class="form-group">
        <label for="lookup-code">Reservation Code</label>
        <input type="text" id="lookup-code" placeholder="e.g. A1B2C3D4" autocomplete="off" style="text-transform: uppercase;">
      </div>
      <div class="form-group">
        <label for="lookup-secret">Access Secret</label>
        <input type="text" id="lookup-secret" placeholder="Your access secret" autocomplete="off" class="monospace-input">
      </div>
      <div id="lookup-error" class="field-error"></div>
      <button class="btn btn-primary" id="lookup-btn">View My Reservation</button>
    </div>
  `;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'pending': return 'status-badge status-badge-pending';
    case 'approved': return 'status-badge status-badge-approved';
    case 'active': return 'status-badge status-badge-active';
    case 'completed': return 'status-badge status-badge-completed';
    case 'cancelled': return 'status-badge status-badge-cancelled';
    default: return 'status-badge';
  }
}

function deliveryBadgeClass(status: string): string {
  switch (status) {
    case 'scheduled': return 'delivery-badge delivery-badge-scheduled';
    case 'delivered': return 'delivery-badge delivery-badge-delivered';
    case 'completed': return 'delivery-badge delivery-badge-completed';
    case 'issue_reported': return 'delivery-badge delivery-badge-issue';
    default: return 'delivery-badge';
  }
}

function formatDateNice(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function renderReservation(data: BookingData): string {
  const motoImage = data.motorcycle.image_url
    ? `<img src="${data.motorcycle.image_url}" alt="${data.motorcycle.name}" class="confirmation-moto-img">`
    : '';
  const motoMeta = data.motorcycle.color || '';

  let deliveryHtml = '';
  if (data.delivery_date_time || data.delivery_location_description || data.delivery_map_link) {
    deliveryHtml = `
      <p><strong>Status:</strong> <span class="${deliveryBadgeClass(data.delivery_status || 'scheduled')}">${data.delivery_status || 'scheduled'}</span></p>
      ${data.delivery_date_time ? `<p><strong>Date &amp; Time:</strong> ${data.delivery_date_time}</p>` : ''}
      ${data.delivery_location_description ? `<p><strong>Location:</strong> ${data.delivery_location_description}</p>` : ''}
      ${data.delivery_map_link ? `<p><strong>Map:</strong> <a href="${data.delivery_map_link}" target="_blank" rel="noopener">View on map</a></p>` : ''}
    `;
  } else {
    deliveryHtml = '<p>Delivery details to be arranged</p>';
  }

  const contractHtml = data.contract_signed_at
    ? `<p>Signed on ${formatDateNice(data.contract_signed_at)}${data.typed_signature_name ? ` by ${data.typed_signature_name}` : ''}</p>`
    : '<p>Not yet signed</p>';

  const paymentBadge = data.payment_status === 'paid'
    ? '<span class="status-badge status-badge-active">Paid</span>'
    : '<span class="status-badge status-badge-pending">Unpaid</span>';

  const reviewCta = data.status === 'completed' && REVIEW_LINK
    ? `<a href="${REVIEW_LINK}" target="_blank" rel="noopener" class="btn review-cta">Leave a Review</a>`
    : '';

  return `
    <div class="reservation-view">
      <div class="confirmation-section">
        <h3>Reservation</h3>
        <div class="reservation-code">
          <span class="reservation-code-value">${data.reservation_code}</span>
        </div>
        <p><strong>Status:</strong> <span class="${statusBadgeClass(data.status)}">${data.status}</span></p>
        <p><strong>Booked:</strong> ${formatDateNice(data.created_at)}</p>
      </div>

      <div class="confirmation-section">
        <h3>Motorcycle</h3>
        <div class="confirmation-moto">
          ${motoImage}
          <div>
            <strong>${data.motorcycle.name}</strong>
            ${motoMeta ? `<div class="text-muted">${motoMeta}</div>` : ''}
          </div>
        </div>
      </div>

      <div class="confirmation-section">
        <h3>Rental Dates</h3>
        <p>${formatDateNice(data.start_date)} &rarr; ${formatDateNice(data.end_date)}</p>
        <p class="text-muted">${data.rental_days} night${data.rental_days !== 1 ? 's' : ''}</p>
      </div>

      <div class="confirmation-section">
        <h3>Pricing</h3>
        <div class="pricing-table">
          <div class="pricing-row">
            <span>Base price</span>
            <span>$${Number(data.base_price_usd).toFixed(2)}</span>
          </div>
          ${Number(data.discount_usd) > 0 ? `<div class="pricing-row pricing-discount"><span>Discount</span><span>-$${Number(data.discount_usd).toFixed(2)}</span></div>` : ''}
          <div class="pricing-row">
            <span>Rental total</span>
            <span>$${Number(data.rental_total_usd).toFixed(2)}</span>
          </div>
          <div class="pricing-row">
            <span>Security deposit</span>
            <span>$${Number(data.security_deposit_usd).toFixed(2)}</span>
          </div>
          <div class="pricing-row pricing-total">
            <span>Total due</span>
            <span>$${Number(data.total_due_usd).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="confirmation-section">
        <h3>Payment</h3>
        <p>${data.payment_method || 'Not specified'} ${paymentBadge}</p>
      </div>

      <div class="confirmation-section">
        <h3>Delivery</h3>
        <div class="delivery-summary">${deliveryHtml}</div>
      </div>

      <div class="confirmation-section">
        <h3>Contract</h3>
        ${contractHtml}
      </div>

      <a href="${MANAGER_WHATSAPP_LINK}" target="_blank" rel="noopener" class="btn whatsapp-cta">Questions? Message us on WhatsApp</a>

      ${reviewCta}

      <button class="btn btn-outline" id="back-to-lookup">Look Up Another Reservation</button>
    </div>
  `;
}

function showError(msg: string): void {
  const el = document.getElementById('lookup-error');
  if (el) el.textContent = msg;
}

async function lookupBooking(code: string, secret: string): Promise<void> {
  const { data, error } = await (supabase as any).rpc('lookup_booking', sanitizeRpcParams({
    p_reservation_code: code.toUpperCase().trim(),
    p_access_secret: secret.trim(),
  })) as { data: BookingData | null; error: { message: string } | null };

  if (error || !data) {
    showError('Invalid reservation code or access secret.');
    return;
  }

  main!.innerHTML = renderReservation(data);

  document.getElementById('back-to-lookup')?.addEventListener('click', () => {
    init();
  });
}

function init(): void {
  // Check URL params for auto-lookup
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const secret = params.get('secret');

  if (code && secret) {
    main!.innerHTML = '<p class="text-center">Loading your reservation...</p>';
    lookupBooking(code, secret);
    return;
  }

  main!.innerHTML = renderLookupForm();

  const lookupBtn = document.getElementById('lookup-btn');
  const codeInput = document.getElementById('lookup-code') as HTMLInputElement;
  const secretInput = document.getElementById('lookup-secret') as HTMLInputElement;

  lookupBtn?.addEventListener('click', () => {
    const c = codeInput.value.trim();
    const s = secretInput.value.trim();
    if (!c || !s) {
      showError('Please enter both your reservation code and access secret.');
      return;
    }
    lookupBtn.textContent = 'Looking up...';
    (lookupBtn as HTMLButtonElement).disabled = true;
    lookupBooking(c, s);
  });
}

init();
