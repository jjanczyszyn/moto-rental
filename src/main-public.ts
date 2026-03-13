import { supabase } from './lib/supabase';
import type { Database } from './lib/database.types';
import { formatDate, parseDate, isValidDateRange, calculateNights } from './lib/utils';

type Motorcycle = Database['public']['Tables']['motorcycles']['Row'];
type BookingRpcArgs = Database['public']['Functions']['create_booking_request']['Args'];
type BookingRpcResult = Database['public']['Functions']['create_booking_request']['Returns'][number];

const main = document.querySelector('main.container');
if (!main) throw new Error('Missing <main class="container"> element');

let motorcycles: Motorcycle[] = [];

// --- Render helpers ---

function renderHero(): string {
  return `
    <section class="hero">
      <h2>Explore the mountains on two wheels</h2>
      <p>Three handpicked motorcycles available for daily rental. Book online, pick up, and ride.</p>
    </section>
  `;
}

function renderLoading(): string {
  return '<div class="loading">Loading motorcycles...</div>';
}

function renderFetchError(): string {
  return '<div class="error-message">Unable to load motorcycles. Please try again later.</div>';
}

function renderCard(moto: Motorcycle): string {
  const rate = Number(moto.daily_rate).toFixed(2);
  const image = moto.image_url
    ? `<img src="${moto.image_url}" alt="${moto.name}" class="motorcycle-card-image">`
    : `<div class="motorcycle-card-image motorcycle-card-placeholder">${moto.name}</div>`;

  return `
    <div class="motorcycle-card">
      ${image}
      <div class="motorcycle-card-body">
        <h3>${moto.name}</h3>
        <p class="motorcycle-card-meta">${moto.brand} ${moto.model} · ${moto.year ?? ''}</p>
        <p class="motorcycle-card-rate">$${rate}/day</p>
        <p class="motorcycle-card-desc">${moto.description ?? ''}</p>
        <button class="btn btn-primary book-btn" data-motorcycle-id="${moto.id}">Book This Bike</button>
      </div>
    </div>
  `;
}

function renderCards(motos: Motorcycle[]): string {
  if (motos.length === 0) {
    return '<p>No motorcycles available at this time.</p>';
  }
  return `
    <section class="motorcycle-cards">
      ${motos.map(renderCard).join('')}
    </section>
  `;
}

function todayStr(): string {
  return formatDate(new Date());
}

function renderBookingForm(preselectedId?: string): string {
  const options = motorcycles
    .map(m => {
      const sel = m.id === preselectedId ? ' selected' : '';
      return `<option value="${m.id}"${sel}>${m.brand} ${m.model}</option>`;
    })
    .join('');

  return `
    <section class="booking-form-section" id="booking-section">
      <h2>Request a Booking</h2>
      <form id="booking-form" class="booking-form" novalidate>
        <div id="form-error" class="form-error" hidden></div>

        <div class="form-group">
          <label for="motorcycle-select">Motorcycle *</label>
          <select id="motorcycle-select" name="motorcycle" required>
            <option value="">Select a motorcycle</option>
            ${options}
          </select>
        </div>

        <div class="form-group">
          <label for="customer-name">Full Name *</label>
          <input type="text" id="customer-name" name="customer_name" required>
        </div>

        <div class="form-group">
          <label for="customer-email">Email</label>
          <input type="email" id="customer-email" name="customer_email">
        </div>

        <div class="form-group">
          <label for="customer-whatsapp">WhatsApp</label>
          <input type="tel" id="customer-whatsapp" name="customer_whatsapp">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="start-date">Start Date *</label>
            <input type="date" id="start-date" name="start_date" min="${todayStr()}" required>
          </div>
          <div class="form-group">
            <label for="end-date">End Date *</label>
            <input type="date" id="end-date" name="end_date" min="${todayStr()}" required>
          </div>
        </div>

        <div id="booking-summary" class="booking-summary" hidden></div>

        <div class="form-group">
          <label for="pickup-notes">Pickup Notes</label>
          <textarea id="pickup-notes" name="pickup_notes" rows="3"></textarea>
        </div>

        <button type="submit" id="submit-btn" class="btn btn-primary" disabled>Submit Booking Request</button>
      </form>
    </section>
  `;
}

function renderSuccess(reservationCode: string, motoName: string, startDate: string, endDate: string, nights: number): string {
  return `
    <section class="booking-success" id="booking-section">
      <h2>Booking Request Submitted!</h2>
      <div class="reservation-code">${reservationCode}</div>
      <div class="booking-details">
        <p><strong>Motorcycle:</strong> ${motoName}</p>
        <p><strong>Dates:</strong> ${startDate} to ${endDate}</p>
        <p><strong>Nights:</strong> ${nights}</p>
      </div>
      <p>Save your reservation code. We'll review your request and get back to you.</p>
      <button class="btn btn-primary" id="another-booking-btn">Submit Another Booking</button>
    </section>
  `;
}

// --- Form logic ---

function getSelectedRate(): number {
  const select = document.getElementById('motorcycle-select') as HTMLSelectElement | null;
  if (!select) return 0;
  const moto = motorcycles.find(m => m.id === select.value);
  return moto ? Number(moto.daily_rate) : 0;
}

function updateSummary(): void {
  const startEl = document.getElementById('start-date') as HTMLInputElement | null;
  const endEl = document.getElementById('end-date') as HTMLInputElement | null;
  const summaryEl = document.getElementById('booking-summary');
  if (!startEl || !endEl || !summaryEl) return;

  if (!startEl.value || !endEl.value) {
    summaryEl.hidden = true;
    return;
  }

  const start = parseDate(startEl.value);
  const end = parseDate(endEl.value);

  if (!isValidDateRange(start, end)) {
    summaryEl.hidden = true;
    return;
  }

  const nights = calculateNights(start, end);
  if (nights <= 0) {
    summaryEl.hidden = true;
    return;
  }

  const rate = getSelectedRate();
  const total = (nights * rate).toFixed(2);
  summaryEl.hidden = false;
  summaryEl.textContent = `${nights} night${nights !== 1 ? 's' : ''} · Estimated total: $${total}`;
}

function updateEndDateMin(): void {
  const startEl = document.getElementById('start-date') as HTMLInputElement | null;
  const endEl = document.getElementById('end-date') as HTMLInputElement | null;
  if (!startEl || !endEl) return;

  if (startEl.value) {
    endEl.min = startEl.value;
    if (endEl.value && endEl.value < startEl.value) {
      endEl.value = '';
    }
  }
}

function updateSubmitButton(): void {
  const form = document.getElementById('booking-form') as HTMLFormElement | null;
  const btn = document.getElementById('submit-btn') as HTMLButtonElement | null;
  if (!form || !btn) return;

  const select = form.querySelector<HTMLSelectElement>('#motorcycle-select');
  const name = form.querySelector<HTMLInputElement>('#customer-name');
  const startDate = form.querySelector<HTMLInputElement>('#start-date');
  const endDate = form.querySelector<HTMLInputElement>('#end-date');

  const allFilled = !!(select?.value && name?.value.trim() && startDate?.value && endDate?.value);

  let datesValid = true;
  if (startDate?.value && endDate?.value) {
    const start = parseDate(startDate.value);
    const end = parseDate(endDate.value);
    datesValid = isValidDateRange(start, end) && calculateNights(start, end) > 0;
  }

  btn.disabled = !(allFilled && datesValid);
}

function showFormError(msg: string): void {
  const el = document.getElementById('form-error');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
}

function hideFormError(): void {
  const el = document.getElementById('form-error');
  if (el) el.hidden = true;
}

function setFormDisabled(disabled: boolean): void {
  const form = document.getElementById('booking-form') as HTMLFormElement | null;
  if (!form) return;
  const elements = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement>('input, select, textarea, button');
  elements.forEach(el => { el.disabled = disabled; });
}

function setSubmitLoading(loading: boolean): void {
  const btn = document.getElementById('submit-btn') as HTMLButtonElement | null;
  if (!btn) return;
  btn.textContent = loading ? 'Submitting...' : 'Submit Booking Request';
}

// --- Event wiring ---

function wireBookButtons(): void {
  const buttons = main!.querySelectorAll<HTMLButtonElement>('.book-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const motoId = btn.dataset.motorcycleId;
      showBookingForm(motoId);
    });
  });
}

function showBookingForm(preselectedId?: string): void {
  const existing = document.getElementById('booking-section');
  if (existing) existing.remove();

  main!.insertAdjacentHTML('beforeend', renderBookingForm(preselectedId));
  wireFormEvents();

  document.getElementById('booking-section')!.scrollIntoView({ behavior: 'smooth' });
}

function wireFormEvents(): void {
  const form = document.getElementById('booking-form') as HTMLFormElement | null;
  if (!form) return;

  const startEl = form.querySelector<HTMLInputElement>('#start-date');
  const endEl = form.querySelector<HTMLInputElement>('#end-date');
  const selectEl = form.querySelector<HTMLSelectElement>('#motorcycle-select');

  startEl?.addEventListener('change', () => {
    updateEndDateMin();
    updateSummary();
    updateSubmitButton();
  });

  endEl?.addEventListener('change', () => {
    updateSummary();
    updateSubmitButton();
  });

  selectEl?.addEventListener('change', () => {
    updateSummary();
    updateSubmitButton();
  });

  form.querySelector<HTMLInputElement>('#customer-name')?.addEventListener('input', updateSubmitButton);

  form.addEventListener('submit', handleSubmit);
}

async function handleSubmit(e: Event): Promise<void> {
  e.preventDefault();
  hideFormError();

  const form = document.getElementById('booking-form') as HTMLFormElement;
  const motoId = (form.querySelector<HTMLSelectElement>('#motorcycle-select'))!.value;
  const customerName = (form.querySelector<HTMLInputElement>('#customer-name'))!.value.trim();
  const customerEmail = (form.querySelector<HTMLInputElement>('#customer-email'))!.value.trim();
  const customerWhatsapp = (form.querySelector<HTMLInputElement>('#customer-whatsapp'))!.value.trim();
  const startDate = (form.querySelector<HTMLInputElement>('#start-date'))!.value;
  const endDate = (form.querySelector<HTMLInputElement>('#end-date'))!.value;
  const pickupNotes = (form.querySelector<HTMLTextAreaElement>('#pickup-notes'))!.value.trim();

  setFormDisabled(true);
  setSubmitLoading(true);

  const rpcArgs: BookingRpcArgs = {
    p_motorcycle_id: motoId,
    p_customer_name: customerName,
    p_customer_email: customerEmail || '',
    p_customer_whatsapp: customerWhatsapp || '',
    p_start_date: startDate,
    p_end_date: endDate,
    p_pickup_notes: pickupNotes || undefined,
  };

  // Type assertion: placeholder database.types.ts doesn't fully satisfy
  // supabase-js v2.99 rpc generics. Real generated types (post-bootstrap) will.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('create_booking_request', rpcArgs) as { data: BookingRpcResult[] | null; error: { message: string } | null };

  if (error) {
    setFormDisabled(false);
    setSubmitLoading(false);
    updateSubmitButton();

    const knownErrors = [
      'Start date must be on or before end date',
      'Motorcycle not found or not available',
      'Motorcycle not available for selected dates',
    ];
    const msg = knownErrors.some(k => error.message.includes(k))
      ? error.message
      : 'Something went wrong. Please try again.';
    showFormError(msg);
    return;
  }

  const result = (data ?? [])[0] as BookingRpcResult | undefined;
  if (!result) {
    showFormError('Something went wrong. Please try again.');
    setFormDisabled(false);
    setSubmitLoading(false);
    return;
  }

  const moto = motorcycles.find(m => m.id === motoId);
  const motoName = moto ? `${moto.brand} ${moto.model}` : '';
  const nights = calculateNights(parseDate(startDate), parseDate(endDate));

  const section = document.getElementById('booking-section');
  if (section) {
    section.outerHTML = renderSuccess(result.reservation_code, motoName, startDate, endDate, nights);
    document.getElementById('another-booking-btn')?.addEventListener('click', () => {
      showBookingForm();
    });
  }
}

// --- Init ---

async function init(): Promise<void> {
  main!.innerHTML = renderHero() + renderLoading();

  const { data, error } = await supabase
    .from('motorcycles')
    .select('*')
    .eq('is_active', true);

  if (error) {
    main!.innerHTML = renderHero() + renderFetchError();
    return;
  }

  motorcycles = data ?? [];
  main!.innerHTML = renderHero() + renderCards(motorcycles);
  wireBookButtons();
}

init();
