import { supabase } from './lib/supabase';
import type { Database } from './lib/database.types';
import { formatDate, parseDate, isValidDateRange, calculateNights, escapeHtml } from './lib/utils';
import { BUSINESS_NAME, UNIVERSAL_INCLUSIONS, MANAGER_WHATSAPP_LINK, MAP_LINK, PAYMENT_METHODS, MANAGER_NAME, PRICING } from './lib/business-config';
import { calculatePricing } from './lib/pricing';
import { sanitizeRpcParams } from './lib/rpc-params';
import { BASE_PATH } from './lib/config';

type Motorcycle = Database['public']['Tables']['motorcycles']['Row'];
// The RPC has overloaded signatures in generated types; extract the new one explicitly.
type BookingRpcArgs = {
  p_motorcycle_id: string;
  p_customer_name: string;
  p_customer_email: string | null;
  p_customer_whatsapp: string | null;
  p_start_date: string;
  p_end_date: string;
  p_payment_method: string | null;
  p_delivery_date_time: string | null;
  p_delivery_map_link: string | null;
  p_delivery_location_description: string | null;
  p_typed_signature_name: string | null;
  p_drawn_signature_data: string | null;
  p_contract_signed_at: string | null;
  p_contract_text: string | null;
};
type BookingRpcResult = { reservation_code: string; booking_id: string; customer_access_secret: string };

const main = document.querySelector('main.container');
if (!main) throw new Error('Missing <main class="container"> element');

let motorcycles: Motorcycle[] = [];

function resolveImageUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return BASE_PATH + url.replace(/^\//, '');
}

// --- Render helpers ---

function renderHero(): string {
  return `
    <section class="hero">
      <h2>${BUSINESS_NAME}</h2>
      <p class="hero-subheading">Simple, reliable motorcycle rentals for surf days and coastal freedom.</p>
    </section>
  `;
}

function renderBenefits(): string {
  const benefits = [
    { icon: '🏍️', text: 'Delivery included' },
    { icon: '🏄', text: 'Surf rack included' },
    { icon: '⛑️', text: '2 helmets included' },
    { icon: '💬', text: 'WhatsApp support' },
  ];
  const items = benefits.map(b =>
    `<div class="benefit-item"><span class="benefit-icon">${b.icon}</span><span class="benefit-text">${b.text}</span></div>`
  ).join('');
  return `<section class="benefits-section"><div class="benefits-grid">${items}</div></section>`;
}

function renderBookingCta(): string {
  return `
    <section class="booking-cta-section" id="booking-section">
      <h3 class="section-heading">Ready to Ride?</h3>
      <p class="booking-cta-text">Pick your dates and bike — we'll handle the rest.</p>
      <button class="btn btn-primary booking-cta-btn">Start Booking</button>
    </section>
  `;
}

function renderFooter(): string {
  return `
    <div class="site-footer">
      <div class="footer-content">
        <div class="footer-brand">
          <strong>${BUSINESS_NAME}</strong>
          <p>Motorcycle rentals on the Pacific coast of Nicaragua.</p>
        </div>
        <div class="footer-contact">
          <a href="${MANAGER_WHATSAPP_LINK}" target="_blank" rel="noopener" class="footer-icon" aria-label="WhatsApp"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
          <a href="${MAP_LINK}" target="_blank" rel="noopener" class="footer-icon" aria-label="Google Maps"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></a>
        </div>
      </div>
    </div>
  `;
}

function renderLoading(): string {
  return '<div class="loading">Loading motorcycles...</div>';
}

function renderFetchError(): string {
  return '<div class="error-message">Unable to load motorcycles. Please try again later.</div>';
}


// --- Wizard ---

const WIZARD_STEPS = [
  { num: 1, label: 'Dates' },
  { num: 2, label: 'Choose' },
  { num: 3, label: 'Pricing' },
  { num: 4, label: 'Details' },
  { num: 5, label: 'Contract' },
  { num: 6, label: 'Confirm' },
] as const;
let wizardSelectedMotoId: string | null = null;
let wizardStartDate: string | null = null;
let wizardEndDate: string | null = null;
let wizardCustomerName = '';
let wizardCustomerWhatsapp = '';
let wizardCustomerEmail = '';
let wizardPaymentMethod = '';
let wizardDeliveryTime = '';
let wizardDeliveryMap = '';
let wizardDeliveryLocation = '';
let wizardDeliveryNotes = '';

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch { return false; }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}

// 30-minute delivery time slots from 07:00 to 21:00
const TIME_SLOTS: string[] = [];
for (let h = 7; h <= 21; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 21) TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}
let wizardTypedSignature = '';
let wizardDrawnSignatureData = '';
let wizardTermsAccepted = false;

function renderWizardStepIndicators(currentStep: number): string {
  const indicators = WIZARD_STEPS.map(s => {
    let stateClass = 'wizard-step-upcoming';
    if (s.num < currentStep + 1) stateClass = 'wizard-step-completed';
    if (s.num === currentStep + 1) stateClass = 'wizard-step-active';

    return `<div class="wizard-step-indicator ${stateClass}">
      <span class="wizard-step-num">${s.num < currentStep + 1 ? '&#10003;' : s.num}</span>
      <span class="wizard-step-label">${s.label}</span>
    </div>`;
  }).join('<div class="wizard-step-connector"></div>');

  return `<div class="wizard-progress-bar">${indicators}</div>`;
}

function renderWizardLiveSummary(): string {
  const sections: string[] = [];

  if (wizardSelectedMotoId) {
    const moto = motorcycles.find(m => m.id === wizardSelectedMotoId);
    if (moto) {
      const image = moto.image_url
        ? `<img src="${resolveImageUrl(moto.image_url)}" alt="${moto.name}" class="summary-moto-thumb">`
        : `<div class="summary-moto-thumb wizard-moto-placeholder">${moto.name}</div>`;
      sections.push(`
        <div class="summary-item">
          ${image}
          <div class="summary-moto-name">${moto.name}</div>
        </div>
      `);
    }
  }

  if (wizardStartDate && wizardEndDate) {
    const start = parseDate(wizardStartDate);
    const end = parseDate(wizardEndDate);
    const days = calculateNights(start, end);
    if (days > 0) {
      const fmtOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      const startFmt = start.toLocaleDateString('en-US', fmtOpts);
      const endFmt = end.toLocaleDateString('en-US', fmtOpts);
      sections.push(`
        <div class="summary-item">
          <div class="summary-label">Dates</div>
          <div class="summary-value">${startFmt} \u2192 ${endFmt}</div>
          <div class="summary-detail">${days} day${days !== 1 ? 's' : ''}</div>
        </div>
      `);

      const pricing = calculatePricing(days);
      sections.push(`
        <div class="summary-item">
          <div class="summary-label">Total</div>
          <div class="summary-value summary-price">$${pricing.rentalTotal.toFixed(2)}</div>
          ${pricing.discountLabel ? `<div class="summary-detail summary-discount">${pricing.discountLabel}</div>` : ''}
        </div>
      `);
    }
  }

  if (wizardCustomerName) {
    sections.push(`
      <div class="summary-item">
        <div class="summary-label">Contact</div>
        <div class="summary-value">${wizardCustomerName}</div>
        ${wizardCustomerWhatsapp ? `<div class="summary-detail">${wizardCustomerWhatsapp}</div>` : ''}
      </div>
    `);
  }

  if (wizardDeliveryTime || wizardDeliveryLocation || wizardDeliveryMap) {
    const deliveryDateStr = wizardStartDate ? parseDate(wizardStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    const timeStr = wizardDeliveryTime || '';
    sections.push(`
      <div class="summary-item summary-delivery">
        <div class="summary-label">Delivery</div>
        ${timeStr ? `<div class="summary-value">${deliveryDateStr} at ${timeStr}</div>` : ''}
        ${wizardDeliveryLocation ? `<div class="summary-detail">${wizardDeliveryLocation}</div>` : ''}
        ${wizardDeliveryMap && !wizardDeliveryLocation ? `<div class="summary-detail">Location provided</div>` : ''}
      </div>
    `);
  }

  if (wizardTypedSignature && wizardTermsAccepted) {
    sections.push(`
      <div class="summary-item">
        <div class="summary-label">Contract</div>
        <div class="summary-value summary-contract-signed">Signed</div>
      </div>
    `);
  }

  if (sections.length === 0) return '';

  return `
    <aside class="wizard-live-summary">
      <h3 class="summary-heading">Your Booking</h3>
      ${sections.join('')}
    </aside>
  `;
}

function renderWizardStep1(): string {
  return `
    <section class="wizard-container" id="booking-section">
      ${renderWizardStepIndicators(0)}
      <div class="wizard-layout-with-summary">
        <div class="wizard-main-content">
          <h2>Choose your dates</h2>
          <p class="wizard-date-instruction">Tap your start date, then tap your end date</p>
          <div class="wizard-calendar" id="wizard-calendar">
            ${renderCalendarMonth(calendarViewYear, calendarViewMonth)}
          </div>
          <div class="cal-legend">
            <span class="cal-legend-item"><span class="cal-swatch cal-swatch-available"></span> Available</span>
            <span class="cal-legend-item"><span class="cal-swatch cal-swatch-selected"></span> Your dates</span>
          </div>
          <div id="wizard-date-error" class="form-error" hidden></div>
          <div id="wizard-date-summary" class="wizard-date-summary" hidden></div>
          <div class="wizard-actions">
            <button class="btn btn-primary wizard-continue" id="wizard-continue-1" disabled>Continue</button>
          </div>
        </div>
        ${renderWizardLiveSummary()}
      </div>
    </section>
  `;
}

function showWizard(): void {
  const existing = document.getElementById('booking-section');
  if (existing) existing.remove();

  // Reset calendar view to current month or previously selected start date
  if (wizardStartDate) {
    const d = parseDate(wizardStartDate);
    calendarViewMonth = d.getMonth();
    calendarViewYear = d.getFullYear();
  } else {
    calendarViewMonth = new Date().getMonth();
    calendarViewYear = new Date().getFullYear();
  }

  // Step 1 (Dates) does not need per-motorcycle booked dates — just gray out past
  bookedDateRanges = [];

  main!.insertAdjacentHTML('beforeend', renderWizardStep1());
  wireWizardStep1();
  updateStep1Summary();
  document.getElementById('booking-section')!.scrollIntoView({ behavior: 'smooth' });
}

function updateStep1Summary(): void {
  const summaryEl = document.getElementById('wizard-date-summary');
  const errorEl = document.getElementById('wizard-date-error');
  const continueBtn = document.getElementById('wizard-continue-1') as HTMLButtonElement | null;
  if (!summaryEl || !errorEl || !continueBtn) return;

  summaryEl.hidden = true;
  errorEl.hidden = true;
  continueBtn.disabled = true;

  if (!wizardStartDate || !wizardEndDate) return;

  const start = parseDate(wizardStartDate);
  const end = parseDate(wizardEndDate);
  const days = calculateNights(start, end);

  if (days <= 0) {
    errorEl.textContent = 'Rental must be at least 1 day.';
    errorEl.hidden = false;
    return;
  }

  const fmtOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  const startFmt = start.toLocaleDateString('en-US', fmtOpts);
  const endFmt = end.toLocaleDateString('en-US', fmtOpts);
  const pricing = calculatePricing(days);
  summaryEl.innerHTML = `${days} day${days !== 1 ? 's' : ''} — ${startFmt} to ${endFmt}<br><strong>$${pricing.rentalTotal.toFixed(2)}</strong>${pricing.discountLabel ? ` <span class="summary-discount">(${pricing.discountLabel})</span>` : ''}`;
  summaryEl.hidden = false;
  continueBtn.disabled = false;
}

function wireWizardStep1(): void {
  wireCalendarEvents();

  document.getElementById('wizard-continue-1')?.addEventListener('click', () => {
    if (wizardStartDate && wizardEndDate) {
      showWizardStep2();
    }
  });
}

// --- Calendar date range picker ---

let calendarViewMonth: number = new Date().getMonth();
let calendarViewYear: number = new Date().getFullYear();
let bookedDateRanges: { start: string; end: string }[] = [];

async function fetchBookedDates(motorcycleId: string): Promise<void> {
  const { data, error } = await supabase
    .from('bookings')
    .select('start_date, end_date')
    .eq('motorcycle_id', motorcycleId)
    .in('status', ['approved', 'active', 'pending']);

  if (!error && data) {
    bookedDateRanges = data.map(b => ({ start: b.start_date, end: b.end_date }));
  } else {
    bookedDateRanges = [];
    if (error) {
      console.error('Failed to fetch booked dates:', error.message);
      const calendar = document.getElementById('calendar');
      if (calendar) {
        calendar.setAttribute('data-fetch-warning', 'true');
        const existingWarning = calendar.parentElement?.querySelector('.booked-dates-warning');
        if (!existingWarning) {
          const warning = document.createElement('p');
          warning.className = 'booked-dates-warning';
          warning.style.cssText = 'color: #b45309; font-size: 0.85rem; margin-top: 0.25rem;';
          warning.textContent = 'Note: Could not load booked dates. Some dates shown as available may already be taken.';
          calendar.parentElement?.appendChild(warning);
        }
      }
    }
  }
}

function isDateBooked(dateStr: string): boolean {
  return bookedDateRanges.some(r => dateStr >= r.start && dateStr < r.end);
}

function isDateInPast(dateStr: string): boolean {
  return dateStr < todayStr();
}

function dateToStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function renderCalendarMonth(year: number, month: number): string {
  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = todayStr();

  const dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    .map(d => `<div class="cal-header-cell">${d}</div>`).join('');

  let cells = '';
  for (let i = 0; i < firstDay; i++) {
    cells += '<div class="cal-cell cal-empty"></div>';
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = dateToStr(year, month, d);
    const booked = isDateBooked(ds);
    const past = ds < today;
    const isStart = ds === wizardStartDate;
    const isEnd = ds === wizardEndDate;
    const inRange = wizardStartDate && wizardEndDate && ds > wizardStartDate && ds < wizardEndDate;
    const disabled = booked || past;

    let cls = 'cal-cell cal-day';
    if (disabled) cls += ' cal-disabled';
    if (booked) cls += ' cal-booked';
    if (isStart) cls += ' cal-range-start';
    if (isEnd) cls += ' cal-range-end';
    if (inRange) cls += ' cal-in-range';
    if (ds === today) cls += ' cal-today';

    cells += `<div class="${cls}" data-date="${ds}"${disabled ? '' : ''}>${d}</div>`;
  }

  return `
    <div class="cal-nav">
      <button type="button" class="btn btn-sm cal-prev" id="cal-prev">&lsaquo;</button>
      <span class="cal-month-label">${monthName}</span>
      <button type="button" class="btn btn-sm cal-next" id="cal-next">&rsaquo;</button>
    </div>
    <div class="cal-grid">
      ${dayHeaders}
      ${cells}
    </div>
  `;
}

let availableMotorcycles: Motorcycle[] = [];

function renderWizardStep2(): string {
  if (availableMotorcycles.length === 0) {
    return `
      <section class="wizard-container" id="booking-section">
        ${renderWizardStepIndicators(1)}
        <div class="wizard-layout-with-summary">
          <div class="wizard-main-content">
            <h2>Choose your motorcycle</h2>
            <div class="wizard-no-availability">
              <p>No motorcycles available for these dates. Try different dates.</p>
              <button class="btn btn-primary" id="wizard-change-dates">Change Dates</button>
            </div>
          </div>
          ${renderWizardLiveSummary()}
        </div>
      </section>
    `;
  }

  const cards = availableMotorcycles.map(moto => {
    const rate = Number(moto.daily_rate).toFixed(2);
    const selected = moto.id === wizardSelectedMotoId;
    const image = moto.image_url
      ? `<img src="${resolveImageUrl(moto.image_url)}" alt="${moto.name}" class="wizard-moto-image">`
      : `<div class="wizard-moto-image wizard-moto-placeholder">${moto.name}</div>`;
    const meta = [moto.color, moto.transmission].filter(Boolean).join(' \u00b7 ');
    return `
      <div class="wizard-moto-card${selected ? ' selected' : ''}" data-moto-id="${moto.id}">
        ${image}
        <div class="wizard-moto-info">
          <strong>${moto.name}</strong>
          <span class="wizard-moto-meta">${meta}</span>
          <span class="wizard-moto-rate">$${rate}/day</span>
        </div>
      </div>`;
  }).join('');

  return `
    <section class="wizard-container" id="booking-section">
      ${renderWizardStepIndicators(1)}
      <div class="wizard-layout-with-summary">
        <div class="wizard-main-content">
          <h2>Choose your motorcycle</h2>
          <div class="wizard-moto-grid">${cards}</div>
          <div class="wizard-actions wizard-actions-split">
            <button class="btn wizard-back" id="wizard-back-2">Back</button>
            <button class="btn btn-primary wizard-continue" id="wizard-continue-2"${wizardSelectedMotoId ? '' : ' disabled'}>Continue</button>
          </div>
        </div>
        ${renderWizardLiveSummary()}
      </div>
    </section>
  `;
}

function refreshCalendar(): void {
  const calEl = document.getElementById('wizard-calendar');
  if (!calEl) return;
  calEl.innerHTML = renderCalendarMonth(calendarViewYear, calendarViewMonth);
  wireCalendarEvents();
}

function hasBookedDateInRange(startStr: string, endStr: string): boolean {
  // Check if any date in [start, end) is booked
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  const d = new Date(start);
  while (d < end) {
    const ds = formatDate(d);
    if (isDateBooked(ds)) return true;
    d.setDate(d.getDate() + 1);
  }
  return false;
}

function updateStep2Summary(): void {
  // No-op — date summary is now handled by updateStep1Summary in Step 1 (Dates)
}

function wireCalendarEvents(): void {
  document.getElementById('cal-prev')?.addEventListener('click', () => {
    calendarViewMonth--;
    if (calendarViewMonth < 0) { calendarViewMonth = 11; calendarViewYear--; }
    refreshCalendar();
  });
  document.getElementById('cal-next')?.addEventListener('click', () => {
    calendarViewMonth++;
    if (calendarViewMonth > 11) { calendarViewMonth = 0; calendarViewYear++; }
    refreshCalendar();
  });

  document.querySelectorAll<HTMLDivElement>('.cal-day:not(.cal-disabled)').forEach(cell => {
    cell.addEventListener('click', () => {
      const dateStr = cell.dataset.date!;
      if (!wizardStartDate || (wizardStartDate && wizardEndDate) || dateStr < wizardStartDate) {
        // First click or reset: set start
        wizardStartDate = dateStr;
        wizardEndDate = null;
      } else {
        // Second click: set end
        wizardEndDate = dateStr;
      }
      // Clear motorcycle selection when dates change (force re-selection)
      wizardSelectedMotoId = null;
      refreshCalendar();
      // Update whichever step summary is active
      updateStep1Summary();
      updateStep2Summary();
    });
  });
}

async function showWizardStep2(): Promise<void> {
  const existing = document.getElementById('booking-section');
  if (existing) existing.remove();

  // Query for motorcycles booked during selected date range
  availableMotorcycles = motorcycles;
  if (wizardStartDate && wizardEndDate) {
    const { data: bookedRows } = await supabase
      .from('bookings')
      .select('motorcycle_id')
      .in('status', ['approved', 'active', 'pending'])
      .lte('start_date', wizardEndDate)
      .gte('end_date', wizardStartDate);

    if (bookedRows) {
      const bookedIds = new Set(bookedRows.map(r => r.motorcycle_id));
      availableMotorcycles = motorcycles.filter(m => !bookedIds.has(m.id));
    }
  }

  main!.insertAdjacentHTML('beforeend', renderWizardStep2());
  wireWizardStep2();
  document.getElementById('booking-section')!.scrollIntoView({ behavior: 'smooth' });
}

function wireWizardStep2(): void {
  // "Change Dates" button (shown when no availability)
  document.getElementById('wizard-change-dates')?.addEventListener('click', () => {
    showWizard();
  });

  // Motorcycle card selection
  const cards = main!.querySelectorAll<HTMLDivElement>('.wizard-moto-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const motoId = card.dataset.motoId;
      if (!motoId) return;
      wizardSelectedMotoId = motoId;

      cards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      const continueBtn = document.getElementById('wizard-continue-2') as HTMLButtonElement | null;
      if (continueBtn) continueBtn.disabled = false;
    });
  });

  document.getElementById('wizard-back-2')?.addEventListener('click', () => {
    showWizard();
  });

  document.getElementById('wizard-continue-2')?.addEventListener('click', () => {
    if (wizardSelectedMotoId && wizardStartDate && wizardEndDate) {
      showWizardStep3();
    }
  });
}

function renderWizardStep3(): string {
  const days = calculateNights(parseDate(wizardStartDate!), parseDate(wizardEndDate!));
  const pricing = calculatePricing(days);

  return `
    <section class="wizard-container" id="booking-section">
      ${renderWizardStepIndicators(2)}
      <div class="wizard-layout-with-summary">
        <div class="wizard-main-content">
          <h2>Review pricing</h2>
          <div class="pricing-breakdown">
            <div class="pricing-row">
              <span>${pricing.days} day${pricing.days !== 1 ? 's' : ''} \u00d7 $${pricing.dailyRate}/day</span>
              <span>$${pricing.baseSubtotal.toFixed(2)}</span>
            </div>
            ${pricing.discountLabel ? `
            <div class="pricing-row pricing-discount">
              <span>${pricing.discountLabel}</span>
              <span>\u2212$${pricing.discountAmount.toFixed(2)}</span>
            </div>` : ''}
            <div class="pricing-row pricing-subtotal">
              <span>Rental total</span>
              <span>$${pricing.rentalTotal.toFixed(2)}</span>
            </div>
            <div class="pricing-row">
              <span>Refundable security deposit</span>
              <span>$${pricing.securityDeposit.toFixed(2)}</span>
            </div>
            <div class="pricing-row pricing-total">
              <span>Total due</span>
              <span>$${pricing.totalDue.toFixed(2)}</span>
            </div>
          </div>
          <div class="wizard-actions wizard-actions-split">
            <button class="btn wizard-back" id="wizard-back-3">Back</button>
            <button class="btn btn-primary wizard-continue" id="wizard-continue-3">Continue to Details</button>
          </div>
        </div>
        ${renderWizardLiveSummary()}
      </div>
    </section>
  `;
}

function showWizardStep3(): void {
  const existing = document.getElementById('booking-section');
  if (existing) existing.remove();

  main!.insertAdjacentHTML('beforeend', renderWizardStep3());
  wireWizardStep3();
  document.getElementById('booking-section')!.scrollIntoView({ behavior: 'smooth' });
}

function wireWizardStep3(): void {
  document.getElementById('wizard-back-3')?.addEventListener('click', () => {
    showWizardStep2();
  });

  document.getElementById('wizard-continue-3')?.addEventListener('click', () => {
    showWizardStep4();
  });
}

function renderWizardStep4(): string {
  const paymentOptions = PAYMENT_METHODS
    .map(pm => {
      const sel = pm.type === wizardPaymentMethod ? ' selected' : '';
      return `<option value="${pm.type}"${sel}>${pm.type}${pm.handle ? ` (${pm.handle})` : ''}</option>`;
    })
    .join('');

  return `
    <section class="wizard-container" id="booking-section">
      ${renderWizardStepIndicators(3)}
      <div class="wizard-layout-with-summary">
        <div class="wizard-main-content">
          <h3 class="wizard-section-heading">Your Contact Info</h3>
          <div class="wizard-details-form">
            <div class="form-group">
              <label for="wizard-name">Full Name *</label>
              <input type="text" id="wizard-name" value="${wizardCustomerName}" required>
            </div>
            <div class="form-group">
              <label for="wizard-whatsapp">WhatsApp Number *</label>
              <input type="tel" id="wizard-whatsapp" value="${wizardCustomerWhatsapp}" required>
              <span class="field-error" id="wizard-phone-error"></span>
            </div>
            <div class="form-group">
              <label for="wizard-email">Email (optional)</label>
              <input type="email" id="wizard-email" value="${wizardCustomerEmail}">
              <span class="field-error" id="wizard-email-error"></span>
            </div>
            <div class="form-group">
              <label for="wizard-payment">Payment Method *</label>
              <select id="wizard-payment" required>
                <option value="">Select payment method</option>
                ${paymentOptions}
              </select>
            </div>
          </div>

          <h3 class="wizard-section-heading wizard-delivery-heading">Where should we deliver your moto?</h3>
          <p class="wizard-delivery-note">Delivery is on your start date (${wizardStartDate ? parseDate(wizardStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}). Choose your preferred time:</p>
          <div class="wizard-details-form">
            <div class="form-group">
              <label for="wizard-delivery-time">Delivery Time</label>
              <select id="wizard-delivery-time">
                <option value="">Select delivery time</option>
                ${TIME_SLOTS.map(t => `<option value="${t}"${t === wizardDeliveryTime ? ' selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="wizard-delivery-location">Where exactly? (hotel name, landmark, address)</label>
              <input type="text" id="wizard-delivery-location" placeholder="e.g. Hotel Selva Verde, Room 12" value="${wizardDeliveryLocation}">
            </div>
            <div class="form-group">
              <label for="wizard-delivery-map">Map link (optional)</label>
              <input type="url" id="wizard-delivery-map" placeholder="https://maps.google.com/..." value="${wizardDeliveryMap}">
              <span class="field-error" id="wizard-delivery-map-error"></span>
            </div>
            <div class="form-group">
              <label for="wizard-delivery-notes">Anything else we should know?</label>
              <textarea id="wizard-delivery-notes" rows="2">${wizardDeliveryNotes}</textarea>
            </div>
          </div>

          <div class="wizard-actions wizard-actions-split">
            <button class="btn wizard-back" id="wizard-back-4">Back</button>
            <button class="btn btn-primary wizard-continue" id="wizard-continue-4" disabled>Continue to Contract</button>
          </div>
        </div>
        ${renderWizardLiveSummary()}
      </div>
    </section>
  `;
}

function showWizardStep4(): void {
  const existing = document.getElementById('booking-section');
  if (existing) existing.remove();

  main!.insertAdjacentHTML('beforeend', renderWizardStep4());
  wireWizardStep4();
  document.getElementById('booking-section')!.scrollIntoView({ behavior: 'smooth' });
}

function wireWizardStep4(): void {
  const nameEl = document.getElementById('wizard-name') as HTMLInputElement;
  const whatsappEl = document.getElementById('wizard-whatsapp') as HTMLInputElement;
  const emailEl = document.getElementById('wizard-email') as HTMLInputElement;
  const paymentEl = document.getElementById('wizard-payment') as HTMLSelectElement;
  const deliveryTimeEl = document.getElementById('wizard-delivery-time') as HTMLSelectElement;
  const deliveryLocationEl = document.getElementById('wizard-delivery-location') as HTMLInputElement;
  const deliveryMapEl = document.getElementById('wizard-delivery-map') as HTMLInputElement;
  const deliveryMapError = document.getElementById('wizard-delivery-map-error')!;
  const deliveryNotesEl = document.getElementById('wizard-delivery-notes') as HTMLTextAreaElement;
  const phoneError = document.getElementById('wizard-phone-error')!;
  const emailError = document.getElementById('wizard-email-error')!;

  function validateFields(): boolean {
    let valid = true;

    // Phone validation
    if (whatsappEl.value.trim() && !isValidPhone(whatsappEl.value.trim())) {
      phoneError.textContent = 'Please enter a valid phone number';
      whatsappEl.classList.add('field-invalid');
      valid = false;
    } else {
      phoneError.textContent = '';
      whatsappEl.classList.remove('field-invalid');
    }

    // Email validation (optional field, but validate if filled)
    if (emailEl.value.trim() && !isValidEmail(emailEl.value.trim())) {
      emailError.textContent = 'Please enter a valid email address';
      emailEl.classList.add('field-invalid');
      valid = false;
    } else {
      emailError.textContent = '';
      emailEl.classList.remove('field-invalid');
    }

    // Map URL validation
    if (deliveryMapEl.value.trim() && !isValidUrl(deliveryMapEl.value.trim())) {
      deliveryMapError.textContent = 'Please enter a valid URL';
      deliveryMapEl.classList.add('field-invalid');
      valid = false;
    } else {
      deliveryMapError.textContent = '';
      deliveryMapEl.classList.remove('field-invalid');
    }

    return valid;
  }

  const updateContinue = () => {
    const btn = document.getElementById('wizard-continue-4') as HTMLButtonElement;
    wizardCustomerName = nameEl.value.trim();
    wizardCustomerWhatsapp = whatsappEl.value.trim();
    wizardCustomerEmail = emailEl.value.trim();
    wizardPaymentMethod = paymentEl.value;
    wizardDeliveryTime = deliveryTimeEl.value;
    wizardDeliveryLocation = deliveryLocationEl.value.trim();
    wizardDeliveryMap = deliveryMapEl.value.trim();
    wizardDeliveryNotes = deliveryNotesEl.value.trim();

    const requiredFilled = !!(nameEl.value.trim() && whatsappEl.value.trim() && paymentEl.value);
    const fieldsValid = validateFields();
    btn.disabled = !(requiredFilled && fieldsValid);
  };

  // Validate on blur
  whatsappEl?.addEventListener('blur', validateFields);
  emailEl?.addEventListener('blur', validateFields);
  deliveryMapEl?.addEventListener('blur', validateFields);

  nameEl?.addEventListener('input', updateContinue);
  whatsappEl?.addEventListener('input', updateContinue);
  paymentEl?.addEventListener('change', updateContinue);
  emailEl?.addEventListener('input', updateContinue);
  deliveryTimeEl?.addEventListener('change', updateContinue);
  deliveryLocationEl?.addEventListener('input', updateContinue);
  deliveryMapEl?.addEventListener('input', updateContinue);
  deliveryNotesEl?.addEventListener('input', updateContinue);

  // Check if state already filled (back navigation)
  updateContinue();

  document.getElementById('wizard-back-4')?.addEventListener('click', () => {
    showWizardStep3();
  });

  document.getElementById('wizard-continue-4')?.addEventListener('click', () => {
    if (!validateFields()) return;
    showWizardStep5();
  });
}

function generateContractText(): string {
  const moto = motorcycles.find(m => m.id === wizardSelectedMotoId);
  const motoName = moto ? `${moto.brand} ${moto.model}` : '';
  const days = calculateNights(parseDate(wizardStartDate!), parseDate(wizardEndDate!));
  const pricing = calculatePricing(days);
  const fmtOpts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  const startFmt = parseDate(wizardStartDate!).toLocaleDateString('en-US', fmtOpts);
  const endFmt = parseDate(wizardEndDate!).toLocaleDateString('en-US', fmtOpts);

  const selectedPm = PAYMENT_METHODS.find(p => p.type === wizardPaymentMethod);
  const paymentDisplay = selectedPm
    ? (selectedPm.handle ? `${selectedPm.type} (${selectedPm.handle})` : selectedPm.type)
    : 'Not specified';

  return [
    'MOTORCYCLE RENTAL AGREEMENT',
    '',
    'This agreement is made between:',
    `  Manager: ${MANAGER_NAME}`,
    `  Renter: ${wizardCustomerName}`,
    '',
    '1. Motorcycle Details',
    `  Make & Model: ${motoName}`,
    ...(moto?.registration_number ? [`  Registration: ${moto.registration_number}`] : []),
    '',
    '2. Rental Terms',
    'The renter agrees to use the motorcycle responsibly and return it in the same condition as received.',
    `  Rental Period: From ${startFmt} to ${endFmt}`,
    `  Rental Fee: $${pricing.rentalTotal.toFixed(2)} (payable in advance)`,
    `Payment Method: ${paymentDisplay}`,
    '',
    '3. Liability & Damages',
    '  - The renter is fully responsible for any damage, loss, or theft of the motorcycle during the rental period.',
    '  - In case of damage, the renter agrees to cover the full repair costs.',
    '  - In case of theft or total loss, the renter agrees to compensate the owner with the full market value of the motorcycle.',
    '',
    '4. Insurance & Legal Responsibilities',
    '  - The renter must follow all traffic laws and is responsible for any fines or penalties incurred.',
    `  - The motorcycle is insured until ${PRICING.insuranceValidUntil}, but the renter is responsible for any damages not covered by insurance.`,
    '',
    '5. Security Deposit',
    `A refundable security deposit of $${PRICING.securityDepositUsd} is required before rental and will be returned upon the motorcycle's return in good condition.`,
    '',
    '6. Termination & Agreement',
    'The owner reserves the right to terminate the rental at any time if the renter violates any terms. By signing this contract, the renter confirms that they have read, understood, and agree to all terms and conditions stated above.',
    '',
    `Owner: ${MANAGER_NAME}`,
    `Renter (typed): ${wizardTypedSignature}`,
    `Signed at: ${new Date().toISOString()}`,
  ].join('\n');
}

function showPrintableContract(): void {
  const contractText = generateContractText();
  const moto = motorcycles.find(m => m.id === wizardSelectedMotoId);
  const motoName = moto ? `${moto.brand} ${moto.model}` : '';
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Rental Agreement — ${motoName}</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; max-width: 700px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.6; }
    h1 { text-align: center; font-size: 1.4rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.1rem; margin-top: 1.5rem; margin-bottom: 0.5rem; }
    p, li { font-size: 0.95rem; }
    ul { padding-left: 1.5rem; }
    .sig-block { margin-top: 2rem; display: flex; gap: 2rem; }
    .sig-block > div { flex: 1; }
    .sig-line { border-top: 1px solid #333; margin-top: 2.5rem; padding-top: 0.3rem; font-size: 0.85rem; }
    .sig-drawn { max-width: 300px; max-height: 120px; margin-top: 0.5rem; }
    .print-hide { margin-bottom: 1rem; }
    @media print { .print-hide { display: none; } }
  </style>
</head>
<body>
  <div class="print-hide"><button onclick="window.print()">Print / Save as PDF</button></div>
  <h1>MOTORCYCLE RENTAL AGREEMENT</h1>
  <p>This agreement is made between:</p>
  <ul>
    <li><strong>Manager:</strong> ${MANAGER_NAME}</li>
    <li><strong>Renter:</strong> ${escapeHtml(wizardCustomerName)}</li>
  </ul>
  <h2>1. Motorcycle Details</h2>
  <ul><li>Make &amp; Model: ${motoName}</li>${moto?.registration_number ? `<li>Registration: ${moto.registration_number}</li>` : ''}</ul>
  <h2>2. Rental Terms</h2>
  <p>The renter agrees to use the motorcycle responsibly and return it in the same condition as received.</p>
  <pre style="white-space: pre-wrap; font-family: inherit; font-size: 0.95rem;">${contractText.split('\n').slice(10, 14).join('\n')}</pre>
  <h2>3. Liability &amp; Damages</h2>
  <ul>
    <li>The renter is fully responsible for any damage, loss, or theft of the motorcycle during the rental period.</li>
    <li>In case of damage, the renter agrees to cover the full repair costs.</li>
    <li>In case of theft or total loss, the renter agrees to compensate the owner with the full market value of the motorcycle.</li>
  </ul>
  <h2>4. Insurance &amp; Legal Responsibilities</h2>
  <ul>
    <li>The renter must follow all traffic laws and is responsible for any fines or penalties incurred.</li>
    <li>The motorcycle is insured until ${PRICING.insuranceValidUntil}, but the renter is responsible for any damages not covered by insurance.</li>
  </ul>
  <h2>5. Security Deposit</h2>
  <p>A refundable security deposit of $${PRICING.securityDepositUsd} is required before rental and will be returned upon the motorcycle's return in good condition.</p>
  <h2>6. Termination &amp; Agreement</h2>
  <p>The owner reserves the right to terminate the rental at any time if the renter violates any terms. By signing this contract, the renter confirms that they have read, understood, and agree to all terms and conditions stated above.</p>
  <div class="sig-block">
    <div>
      <p><strong>Owner:</strong></p>
      <p>${MANAGER_NAME}</p>
      <div class="sig-line">Signature</div>
    </div>
    <div>
      <p><strong>Renter:</strong></p>
      <p>${escapeHtml(wizardTypedSignature)}</p>
      ${wizardDrawnSignatureData ? `<img src="${wizardDrawnSignatureData}" alt="Drawn signature" class="sig-drawn">` : ''}
      <div class="sig-line">Signature</div>
    </div>
  </div>
</body>
</html>`);
  printWindow.document.close();
}

function renderContractBody(): string {
  const moto = motorcycles.find(m => m.id === wizardSelectedMotoId);
  const motoName = moto ? `${moto.brand} ${moto.model}` : '';
  const days = calculateNights(parseDate(wizardStartDate!), parseDate(wizardEndDate!));
  const pricing = calculatePricing(days);
  const fmtOpts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  const startFmt = parseDate(wizardStartDate!).toLocaleDateString('en-US', fmtOpts);
  const endFmt = parseDate(wizardEndDate!).toLocaleDateString('en-US', fmtOpts);

  const htmlSelectedPm = PAYMENT_METHODS.find(p => p.type === wizardPaymentMethod);
  const htmlPaymentDisplay = htmlSelectedPm
    ? (htmlSelectedPm.handle ? `${htmlSelectedPm.type} (${htmlSelectedPm.handle})` : htmlSelectedPm.type)
    : 'Not specified';

  return `
    <div class="contract-body">
      <h3 class="contract-title">MOTORCYCLE RENTAL AGREEMENT</h3>
      <p class="contract-parties">This agreement is made between:</p>
      <ul class="contract-list">
        <li><strong>Manager:</strong> ${MANAGER_NAME}</li>
        <li><strong>Renter:</strong> ${escapeHtml(wizardCustomerName)}</li>
      </ul>

      <h4>1. Motorcycle Details</h4>
      <ul class="contract-list"><li>Make &amp; Model: ${motoName}</li>${moto?.registration_number ? `<li>Registration: ${moto.registration_number}</li>` : ''}</ul>

      <h4>2. Rental Terms</h4>
      <p>The renter agrees to use the motorcycle responsibly and return it in the same condition as received.</p>
      <ul class="contract-list">
        <li>Rental Period: From ${startFmt} to ${endFmt}</li>
        <li>Rental Fee: $${pricing.rentalTotal.toFixed(2)} (payable in advance)</li>
      </ul>
      <p>Payment Method: ${htmlPaymentDisplay}</p>

      <h4>3. Liability &amp; Damages</h4>
      <ul class="contract-list">
        <li>The renter is fully responsible for any damage, loss, or theft of the motorcycle during the rental period.</li>
        <li>In case of damage, the renter agrees to cover the full repair costs.</li>
        <li>In case of theft or total loss, the renter agrees to compensate the owner with the full market value of the motorcycle.</li>
      </ul>

      <h4>4. Insurance &amp; Legal Responsibilities</h4>
      <ul class="contract-list">
        <li>The renter must follow all traffic laws and is responsible for any fines or penalties incurred.</li>
        <li>The motorcycle is insured until ${PRICING.insuranceValidUntil}, but the renter is responsible for any damages not covered by insurance.</li>
      </ul>

      <h4>5. Security Deposit</h4>
      <p>A refundable security deposit of $${PRICING.securityDepositUsd} is required before rental and will be returned upon the motorcycle's return in good condition.</p>

      <h4>6. Termination &amp; Agreement</h4>
      <p>The owner reserves the right to terminate the rental at any time if the renter violates any terms. By signing this contract, the renter confirms that they have read, understood, and agree to all terms and conditions stated above.</p>

      <div class="contract-signatures">
        <div class="contract-sig-block">
          <p><strong>Owner:</strong></p>
          <p>${MANAGER_NAME}</p>
          <p class="contract-sig-line">Signature: ____________________________</p>
        </div>
      </div>
    </div>
  `;
}

function renderWizardStep5(): string {
  return `
    <section class="wizard-container" id="booking-section">
      ${renderWizardStepIndicators(4)}
      <div class="wizard-layout-with-summary">
        <div class="wizard-main-content">
          <h2>Review &amp; Sign Contract</h2>
          ${renderContractBody()}

          <div class="contract-sign-section">
            <h4>Your Signature</h4>
            <div class="form-group">
              <label for="wizard-typed-sig">Type your full name as signature *</label>
              <input type="text" id="wizard-typed-sig" class="contract-sig-input" value="${wizardTypedSignature}" placeholder="${wizardCustomerName}" required>
            </div>
            <div class="form-group">
              <label>Draw your signature *</label>
              <div class="signature-canvas-wrapper">
                <canvas id="wizard-sig-canvas" class="signature-canvas" width="460" height="160"></canvas>
                <button type="button" class="btn btn-sm signature-clear-btn" id="wizard-sig-clear">Clear</button>
              </div>
            </div>
            <div class="form-group contract-terms-group">
              <label class="contract-checkbox-label">
                <input type="checkbox" id="wizard-terms-check"${wizardTermsAccepted ? ' checked' : ''}>
                <span>I have read, understood, and agree to all terms and conditions stated above. *</span>
              </label>
            </div>
          </div>

          <div class="wizard-actions wizard-actions-split">
            <button class="btn wizard-back" id="wizard-back-5">Back</button>
            <button class="btn btn-primary wizard-continue" id="wizard-continue-5" disabled>Sign &amp; Submit Booking</button>
          </div>
        </div>
        ${renderWizardLiveSummary()}
      </div>
    </section>
  `;
}

function showWizardStep5(): void {
  const existing = document.getElementById('booking-section');
  if (existing) existing.remove();

  main!.insertAdjacentHTML('beforeend', renderWizardStep5());
  wireWizardStep5();
  document.getElementById('booking-section')!.scrollIntoView({ behavior: 'smooth' });
}

function wireWizardStep5(): void {
  const typedSigEl = document.getElementById('wizard-typed-sig') as HTMLInputElement;
  const termsEl = document.getElementById('wizard-terms-check') as HTMLInputElement;
  const canvas = document.getElementById('wizard-sig-canvas') as HTMLCanvasElement;
  const clearBtn = document.getElementById('wizard-sig-clear');
  const continueBtn = document.getElementById('wizard-continue-5') as HTMLButtonElement;

  let hasDrawn = !!wizardDrawnSignatureData;
  let isDrawing = false;

  const ctx = canvas.getContext('2d')!;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#1a1a1a';

  // Restore previous signature if navigating back
  if (wizardDrawnSignatureData) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = wizardDrawnSignatureData;
  }

  function getCanvasPoint(e: MouseEvent | Touch): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  // Mouse events
  canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const pt = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const pt = getCanvasPoint(e);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    hasDrawn = true;
  });

  canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    wizardDrawnSignatureData = canvas.toDataURL('image/png');
    updateContinue5();
  });

  canvas.addEventListener('mouseleave', () => {
    if (isDrawing) {
      isDrawing = false;
      wizardDrawnSignatureData = canvas.toDataURL('image/png');
      updateContinue5();
    }
  });

  // Touch events
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isDrawing = true;
    const pt = getCanvasPoint(e.touches[0]);
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pt = getCanvasPoint(e.touches[0]);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    hasDrawn = true;
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    isDrawing = false;
    wizardDrawnSignatureData = canvas.toDataURL('image/png');
    updateContinue5();
  });

  // Clear button
  clearBtn?.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn = false;
    wizardDrawnSignatureData = '';
    updateContinue5();
  });

  function updateContinue5(): void {
    wizardTypedSignature = typedSigEl.value.trim();
    wizardTermsAccepted = termsEl.checked;
    continueBtn.disabled = !(wizardTypedSignature && hasDrawn && wizardTermsAccepted);
  }

  typedSigEl?.addEventListener('input', updateContinue5);
  termsEl?.addEventListener('change', updateContinue5);
  updateContinue5();

  // Navigation
  document.getElementById('wizard-back-5')?.addEventListener('click', () => {
    showWizardStep4();
  });

  document.getElementById('wizard-continue-5')?.addEventListener('click', async () => {
    if (!wizardSelectedMotoId) return;
    continueBtn.disabled = true;
    continueBtn.textContent = 'Submitting...';

    // Build delivery datetime from start date + selected time
    let deliveryDateTime: string | undefined;
    if (wizardDeliveryTime && wizardStartDate) {
      deliveryDateTime = `${wizardStartDate}T${wizardDeliveryTime}:00`;
    }

    // Combine location description with any extra notes
    let locationDesc = wizardDeliveryLocation || undefined;
    if (wizardDeliveryNotes && locationDesc) {
      locationDesc = `${locationDesc} — ${wizardDeliveryNotes}`;
    } else if (wizardDeliveryNotes) {
      locationDesc = wizardDeliveryNotes;
    }

    const rpcArgs: BookingRpcArgs = {
      p_motorcycle_id: wizardSelectedMotoId,
      p_customer_name: wizardCustomerName,
      p_customer_email: wizardCustomerEmail || null,
      p_customer_whatsapp: wizardCustomerWhatsapp || null,
      p_start_date: wizardStartDate!,
      p_end_date: wizardEndDate!,
      p_payment_method: wizardPaymentMethod || null,
      p_delivery_date_time: deliveryDateTime ?? null,
      p_delivery_map_link: (wizardDeliveryMap && isValidUrl(wizardDeliveryMap)) ? wizardDeliveryMap : null,
      p_delivery_location_description: locationDesc ?? null,
      p_typed_signature_name: wizardTypedSignature || null,
      p_drawn_signature_data: wizardDrawnSignatureData || null,
      p_contract_signed_at: new Date().toISOString(),
      p_contract_text: generateContractText(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('create_booking_request', sanitizeRpcParams(rpcArgs)) as { data: BookingRpcResult | null; error: { message: string } | null };

    if (error) {
      continueBtn.disabled = false;
      continueBtn.innerHTML = 'Sign &amp; Submit Booking';
      alert(error.message || 'Something went wrong. Please try again.');
      return;
    }

    const result = data as BookingRpcResult | undefined;
    if (!result) {
      continueBtn.disabled = false;
      continueBtn.innerHTML = 'Sign &amp; Submit Booking';
      alert('Something went wrong. Please try again.');
      return;
    }

    showConfirmation(result.reservation_code, result.customer_access_secret);
  });
}

function showConfirmation(reservationCode: string, accessSecret?: string): void {
  const existing = document.getElementById('booking-section');
  if (existing) existing.remove();

  main!.insertAdjacentHTML('beforeend', renderConfirmation(reservationCode, accessSecret));
  document.getElementById('print-contract-btn')?.addEventListener('click', () => {
    showPrintableContract();
  });
  document.getElementById('another-booking-btn')?.addEventListener('click', () => {
    const section = document.getElementById('booking-section');
    if (section) section.remove();
    showWizard();
  });
  document.getElementById('booking-section')!.scrollIntoView({ behavior: 'smooth' });
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

function renderConfirmation(reservationCode: string, accessSecret?: string): string {
  const moto = motorcycles.find(m => m.id === wizardSelectedMotoId);
  const motoName = moto ? moto.name : '';
  const motoImage = moto?.image_url
    ? `<img src="${resolveImageUrl(moto.image_url)}" alt="${motoName}" class="confirmation-moto-img">`
    : '';
  const motoMeta = moto ? [moto.color, moto.transmission].filter(Boolean).join(' \u00b7 ') : '';

  const start = parseDate(wizardStartDate!);
  const end = parseDate(wizardEndDate!);
  const days = calculateNights(start, end);
  const pricing = calculatePricing(days);
  const fmtOpts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  const startFmt = start.toLocaleDateString('en-US', fmtOpts);
  const endFmt = end.toLocaleDateString('en-US', fmtOpts);

  const pm = PAYMENT_METHODS.find(p => p.type === wizardPaymentMethod);
  const paymentDisplay = pm
    ? `<span class="payment-type">${pm.type}</span>${pm.handle ? `<span class="payment-handle">${pm.handle}</span>` : ''}`
    : wizardPaymentMethod;

  let deliveryHtml = '';
  const deliveryDateDisplay = wizardStartDate ? parseDate(wizardStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  if (wizardDeliveryTime || wizardDeliveryLocation || wizardDeliveryMap || wizardDeliveryNotes) {
    deliveryHtml = `
      ${wizardDeliveryTime ? `<p><strong>Date &amp; Time:</strong> ${deliveryDateDisplay} at ${wizardDeliveryTime}</p>` : ''}
      ${wizardDeliveryLocation ? `<p><strong>Location:</strong> ${wizardDeliveryLocation}</p>` : ''}
      ${wizardDeliveryMap ? `<p><strong>Map:</strong> <a href="${wizardDeliveryMap}" target="_blank" rel="noopener">View on map</a></p>` : ''}
      ${wizardDeliveryNotes ? `<p><strong>Notes:</strong> ${wizardDeliveryNotes}</p>` : ''}
    `;
  } else {
    deliveryHtml = '<p class="delivery-pending">Delivery details to be arranged</p>';
  }

  return `
    <section class="booking-success" id="booking-section">
      <div class="success-header">
        <div class="success-check"></div>
        <h2>Booking Request Submitted!</h2>
        <p class="success-subtitle">Your reservation is being reviewed</p>
      </div>

      <div class="reservation-code">
        <span class="reservation-code-value">${reservationCode}</span>
        <p class="reservation-code-hint">Save this code — you'll need it to check your reservation status</p>
      </div>

      <div class="confirmation-section">
        <h3>Motorcycle</h3>
        <div class="confirmation-moto">
          ${motoImage}
          <div>
            <strong>${motoName}</strong>
            ${motoMeta ? `<p class="confirmation-moto-meta">${motoMeta}</p>` : ''}
          </div>
        </div>
      </div>

      <div class="confirmation-section">
        <h3>Rental Dates</h3>
        <p>${startFmt} &rarr; ${endFmt}</p>
        <p class="confirmation-detail">${days} day${days !== 1 ? 's' : ''}</p>
      </div>

      <div class="confirmation-section">
        <h3>Pricing</h3>
        <div class="pricing-table">
          <div class="pricing-row">
            <span>${pricing.days} day${pricing.days !== 1 ? 's' : ''} &times; $${pricing.dailyRate}/day</span>
            <span>$${pricing.baseSubtotal.toFixed(2)}</span>
          </div>
          ${pricing.discountLabel ? `
          <div class="pricing-row pricing-discount">
            <span>${pricing.discountLabel}</span>
            <span>&minus;$${pricing.discountAmount.toFixed(2)}</span>
          </div>` : ''}
          <div class="pricing-row pricing-subtotal">
            <span>Rental total</span>
            <span>$${pricing.rentalTotal.toFixed(2)}</span>
          </div>
          <div class="pricing-row">
            <span>Refundable security deposit</span>
            <span>$${pricing.securityDeposit.toFixed(2)}</span>
          </div>
          <div class="pricing-row pricing-total">
            <span>Total due</span>
            <span>$${pricing.totalDue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="confirmation-section">
        <h3>Payment Method</h3>
        <div class="payment-method-display">${paymentDisplay}</div>
      </div>

      <div class="confirmation-section">
        <h3>Delivery</h3>
        <div class="delivery-summary">
          <p><strong>Status:</strong> <span class="delivery-badge delivery-badge-scheduled">Scheduled</span></p>
          ${deliveryHtml}
        </div>
      </div>

      <div class="confirmation-section">
        <h3>What's Next</h3>
        <ol class="next-steps-list">
          <li>We'll review your request and confirm within 24 hours</li>
          <li>You'll receive a WhatsApp message with next steps</li>
          <li>Payment is due before your rental start date</li>
        </ol>
      </div>

      ${accessSecret ? `
      <div class="confirmation-section">
        <h3>Check Your Reservation</h3>
        <p>You can check your reservation status anytime:</p>
        <p><a href="/customer.html?code=${encodeURIComponent(reservationCode)}&secret=${encodeURIComponent(accessSecret)}" class="customer-access-link">${window.location.origin}/customer.html?code=${reservationCode}&amp;secret=${accessSecret}</a></p>
        <p class="text-muted">Save this link — it's your access to view your booking details.</p>
      </div>
      ` : ''}

      <button class="btn btn-outline" id="print-contract-btn">Print Contract</button>

      <a href="${MANAGER_WHATSAPP_LINK}" target="_blank" rel="noopener" class="btn whatsapp-cta">Questions? Message us on WhatsApp</a>

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

  // Pre-submit validation: required fields
  if (!motoId || !startDate || !endDate || !customerName || (!customerEmail && !customerWhatsapp)) {
    showFormError('Please fill in all required fields (motorcycle, dates, and at least one contact method).');
    return;
  }

  setFormDisabled(true);
  setSubmitLoading(true);

  const rpcArgs: BookingRpcArgs = {
    p_motorcycle_id: motoId,
    p_customer_name: customerName,
    p_customer_email: customerEmail || null,
    p_customer_whatsapp: customerWhatsapp || null,
    p_start_date: startDate,
    p_end_date: endDate,
    p_payment_method: null,
    p_delivery_date_time: null,
    p_delivery_map_link: null,
    p_delivery_location_description: null,
    p_typed_signature_name: null,
    p_drawn_signature_data: null,
    p_contract_signed_at: null,
    p_contract_text: null,
  };

  // Type assertion: placeholder database.types.ts doesn't fully satisfy
  // supabase-js v2.99 rpc generics. Real generated types (post-bootstrap) will.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('create_booking_request', sanitizeRpcParams(rpcArgs)) as { data: BookingRpcResult | null; error: { message: string } | null };

  if (error) {
    setFormDisabled(false);
    setSubmitLoading(false);
    updateSubmitButton();

    const knownErrors = [
      'Start date must be on or before end date',
      'Motorcycle not found or not available',
      'Motorcycle not available for selected dates',
      'Motorcycle is not available for the selected dates',
      'start_date must be before end_date',
      'start_date cannot be in the past',
      'Motorcycle not found or not active',
    ];
    const msg = knownErrors.some(k => error.message.includes(k))
      ? error.message
      : 'Something went wrong. Please try again.';
    showFormError(msg);
    return;
  }

  const result = data as BookingRpcResult | undefined;
  if (!result) {
    showFormError('Something went wrong. Please try again.');
    setFormDisabled(false);
    setSubmitLoading(false);
    return;
  }

  // Populate wizard state from form for confirmation page
  wizardSelectedMotoId = motoId;
  wizardStartDate = startDate;
  wizardEndDate = endDate;
  wizardCustomerName = customerName;
  wizardCustomerWhatsapp = customerWhatsapp;
  wizardCustomerEmail = customerEmail;

  showConfirmation(result.reservation_code, result.customer_access_secret);
}

// --- Init ---


function wireBookingCta(): void {
  const btn = main!.querySelector('.booking-cta-btn');
  if (btn) {
    btn.addEventListener('click', () => showWizard());
  }
}

async function init(): Promise<void> {
  main!.innerHTML = renderHero() + renderLoading();

  const { data, error } = await supabase
    .from('motorcycles')
    .select('*')
    .eq('is_active', true);

  if (error) {
    main!.innerHTML = renderHero() + renderBenefits() + renderFetchError();
  
    return;
  }

  motorcycles = data ?? [];
  main!.innerHTML =
    renderHero() +
    renderBenefits() +
    renderBookingCta();

  wireBookingCta();

  // Populate footer in the actual <footer> element
  const footer = document.querySelector('footer .container');
  if (footer) footer.innerHTML = renderFooter();
}

init();
