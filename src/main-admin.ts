import { supabase } from './lib/supabase';
import { signInWithGoogle, signOut, getSession, getUser, onAuthStateChange } from './lib/auth';
import { MANAGER_EMAIL } from './lib/config';
import { REVIEW_LINK } from './lib/business-config';
import { parseDate, calculateNights } from './lib/utils';
import type { Database } from './lib/database.types';
import type { Session } from '@supabase/supabase-js';

type Booking = Database['public']['Tables']['bookings']['Row'];

interface BookingWithMoto extends Booking {
  motorcycles: { name: string; brand: string; model: string; registration_number: string | null } | null;
}

type StatusGroup = {
  label: string;
  statuses: string[];
  bookings: BookingWithMoto[];
};

const STATUS_GROUPS: Omit<StatusGroup, 'bookings'>[] = [
  { label: 'Pending', statuses: ['pending'] },
  { label: 'Approved / Upcoming', statuses: ['approved'] },
  { label: 'Active', statuses: ['active'] },
  { label: 'Past / Done', statuses: ['completed'] },
  { label: 'Cancelled / Rejected', statuses: ['cancelled', 'rejected'] },
];

const BADGE_COLORS: Record<string, string> = {
  pending: 'badge-pending',
  approved: 'badge-approved',
  active: 'badge-active',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
  rejected: 'badge-cancelled',
};

const DELIVERY_STATUSES = ['scheduled', 'delivered', 'completed', 'issue_reported'] as const;

const DELIVERY_BADGE_COLORS: Record<string, string> = {
  scheduled: 'delivery-badge-scheduled',
  delivered: 'delivery-badge-delivered',
  completed: 'delivery-badge-completed',
  issue_reported: 'delivery-badge-issue',
};

const DELIVERY_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  delivered: 'Delivered',
  completed: 'Completed',
  issue_reported: 'Issue Reported',
};

const STATUS_ACTIONS: Record<string, { label: string; target: string; danger: boolean }[]> = {
  pending: [
    { label: 'Approve', target: 'approved', danger: false },
    { label: 'Reject', target: 'rejected', danger: true },
  ],
  approved: [
    { label: 'Mark Active', target: 'active', danger: false },
    { label: 'Cancel', target: 'cancelled', danger: true },
  ],
  active: [
    { label: 'Mark Completed', target: 'completed', danger: false },
    { label: 'Cancel', target: 'cancelled', danger: true },
  ],
};

const PAYMENT_BADGE_COLORS: Record<string, string> = {
  unpaid: 'badge-pending',
  paid: 'badge-approved',
  refunded: 'badge-completed',
};

let currentEmail = '';
let showingUnauthorized = false;
let currentView: 'status' | 'motorcycle' | 'deliveries' = 'status';
let allBookings: BookingWithMoto[] = [];
let deliveryFilter: 'today' | 'tomorrow' | '7days' | 'custom' = 'today';
let deliveryCustomStart = '';
let deliveryCustomEnd = '';

const app = document.getElementById('app');
if (!app) throw new Error('Missing <div id="app"> element');

// --- Render helpers ---

function renderHeader(email?: string): string {
  if (email) {
    return `
      <div class="admin-header">
        <h1>Karen & JJ — Admin</h1>
        <div class="admin-user">
          <span class="admin-email">${email}</span>
          <button class="btn" id="signout-btn">Sign Out</button>
        </div>
      </div>
    `;
  }
  return '<div class="admin-header"><h1>Karen & JJ — Admin</h1></div>';
}

function renderLoading(): string {
  return `
    ${renderHeader()}
    <div class="admin-content"><div class="loading">Checking session...</div></div>
  `;
}

function renderSignedOut(): string {
  return `
    ${renderHeader()}
    <div class="signin-container">
      <p>Sign in with your manager account to access the dashboard.</p>
      <button class="btn btn-primary signin-btn" id="signin-btn">Sign in with Google</button>
    </div>
  `;
}

function renderUnauthorized(email: string): string {
  return `
    ${renderHeader()}
    <div class="unauthorized-container">
      <h2>Access Denied</h2>
      <p>The account <strong>${email}</strong> is not authorized to access this dashboard.</p>
      <p>Please sign in with the manager account.</p>
      <button class="btn btn-primary" id="signin-btn">Sign in with a different account</button>
    </div>
  `;
}

function renderDashboardLoading(email: string): string {
  return `
    ${renderHeader(email)}
    <div class="admin-content"><div class="loading">Loading bookings...</div></div>
  `;
}

function renderDashboardError(email: string): string {
  return `
    ${renderHeader(email)}
    <div class="admin-content">
      <div class="error-message">Unable to load bookings. Please try again later.</div>
    </div>
  `;
}

function todayRange(): [Date, Date] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return [start, end];
}

function getDeliveriesToday(bookings: BookingWithMoto[]): BookingWithMoto[] {
  const [start, end] = todayRange();
  return bookings.filter(b =>
    b.delivery_date_time &&
    b.status !== 'cancelled' &&
    new Date(b.delivery_date_time) >= start &&
    new Date(b.delivery_date_time) < end
  );
}

function getOverdueDeliveries(bookings: BookingWithMoto[]): BookingWithMoto[] {
  const now = new Date();
  return bookings.filter(b =>
    b.delivery_date_time &&
    b.status !== 'cancelled' &&
    b.delivery_status === 'scheduled' &&
    new Date(b.delivery_date_time) < now
  );
}

function renderMetricsBar(bookings: BookingWithMoto[]): string {
  const active = bookings.filter(b => b.status === 'active');
  const pending = bookings.filter(b => b.status === 'pending');
  const totalEarnings = bookings
    .filter(b => ['active', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + Number(b.rental_total_usd || 0), 0);

  const uniqueMotos = new Set(bookings.map(b => b.motorcycle_id));
  const occupancy = uniqueMotos.size > 0
    ? Math.round((active.length / uniqueMotos.size) * 100)
    : 0;

  const deliveriesToday = getDeliveriesToday(bookings).length;
  const overdue = getOverdueDeliveries(bookings).length;
  const overdueIndicator = overdue > 0
    ? `<span class="metric-overdue">${overdue} overdue</span>`
    : '';

  // Payment method breakdown for active+completed bookings
  const payableBookings = bookings.filter(b => ['active', 'completed'].includes(b.status));
  const methodCounts = new Map<string, number>();
  for (const b of payableBookings) {
    const method = b.payment_method || 'Unspecified';
    methodCounts.set(method, (methodCounts.get(method) || 0) + 1);
  }
  const methodBreakdown = Array.from(methodCounts.entries())
    .map(([method, count]) => `${method}: ${count}`)
    .join(' · ');

  return `
    <div class="metrics-bar">
      <div class="metric-card">
        <div class="metric-value">$${totalEarnings.toFixed(0)}</div>
        <div class="metric-label">Earnings</div>
        ${methodBreakdown ? `<div class="metric-sub">${methodBreakdown}</div>` : ''}
      </div>
      <div class="metric-card">
        <div class="metric-value">${active.length}</div>
        <div class="metric-label">Active</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${occupancy}%</div>
        <div class="metric-label">Occupancy</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${pending.length}</div>
        <div class="metric-label">Pending</div>
      </div>
      <div class="metric-card metric-card-clickable" id="metric-deliveries">
        <div class="metric-value">${deliveriesToday}</div>
        <div class="metric-label">Deliveries Today</div>
        ${overdueIndicator}
      </div>
    </div>
  `;
}

function renderViewToggle(): string {
  return `
    <div class="view-toggle">
      <button class="btn btn-sm view-toggle-btn${currentView === 'status' ? ' view-toggle-active' : ''}" data-view="status">By Status</button>
      <button class="btn btn-sm view-toggle-btn${currentView === 'motorcycle' ? ' view-toggle-active' : ''}" data-view="motorcycle">By Motorcycle</button>
      <button class="btn btn-sm view-toggle-btn${currentView === 'deliveries' ? ' view-toggle-active' : ''}" data-view="deliveries">Deliveries</button>
    </div>
  `;
}

function renderBadge(status: string): string {
  const cls = BADGE_COLORS[status] || 'badge-pending';
  return `<span class="status-badge ${cls}">${status}</span>`;
}

function renderActions(b: BookingWithMoto): string {
  const actions = STATUS_ACTIONS[b.status];
  if (!actions || actions.length === 0) return '';

  const buttons = actions.map(a => {
    const cls = a.danger ? 'btn btn-danger btn-sm' : 'btn btn-primary btn-sm';
    return `<button class="${cls}" data-action="${a.target}" data-booking-id="${b.id}" data-danger="${a.danger}">${a.label}</button>`;
  }).join('');

  return `<div class="booking-actions">${buttons}</div>`;
}

function renderNotesSection(b: BookingWithMoto): string {
  const notesDisplay = b.manager_notes
    ? `<div class="booking-notes"><strong>Notes:</strong> ${b.manager_notes}</div>`
    : '<div class="booking-notes booking-notes-empty">No notes</div>';

  return `
    ${notesDisplay}
    <button class="btn btn-sm edit-notes-btn" data-booking-id="${b.id}" data-notes="${escapeAttr(b.manager_notes ?? '')}">Edit Notes</button>
  `;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderDeliveryStatus(b: BookingWithMoto): string {
  const current = b.delivery_status || 'scheduled';
  const badgeCls = DELIVERY_BADGE_COLORS[current] || 'delivery-badge-scheduled';
  const label = DELIVERY_LABELS[current] || current;

  const options = DELIVERY_STATUSES.map(s => {
    const sel = s === current ? ' selected' : '';
    return `<option value="${s}"${sel}>${DELIVERY_LABELS[s]}</option>`;
  }).join('');

  return `
    <div class="booking-delivery-status">
      <span class="delivery-status-label">Delivery:</span>
      <span class="delivery-badge ${badgeCls}">${label}</span>
      <select class="delivery-status-select" data-booking-id="${b.id}" data-current="${current}">
        ${options}
      </select>
    </div>
  `;
}

function renderPaymentStatus(b: BookingWithMoto): string {
  const current = b.payment_status || 'unpaid';
  const badgeCls = PAYMENT_BADGE_COLORS[current] || 'badge-pending';
  return `
    <div class="booking-payment-status">
      <span class="payment-status-label">Payment:</span>
      <span class="status-badge ${badgeCls}">${current}</span>
      <select class="payment-status-select" data-booking-id="${b.id}" data-current="${current}">
        <option value="unpaid"${current === 'unpaid' ? ' selected' : ''}>Unpaid</option>
        <option value="paid"${current === 'paid' ? ' selected' : ''}>Paid</option>
        <option value="refunded"${current === 'refunded' ? ' selected' : ''}>Refunded</option>
      </select>
    </div>
  `;
}

function renderBookingDetail(b: BookingWithMoto): string {
  const nights = b.rental_days || calculateNights(parseDate(b.start_date), parseDate(b.end_date));

  let pricingHtml = '';
  if (b.rental_total_usd) {
    pricingHtml = `
      <div class="detail-section">
        <h4>Pricing</h4>
        <p>${nights} days &times; $${Number(b.base_price_usd || 0) / Math.max(nights, 1)}/day = $${Number(b.base_price_usd || 0).toFixed(2)}</p>
        ${b.discount_usd && Number(b.discount_usd) > 0 ? `<p>Discount: -$${Number(b.discount_usd).toFixed(2)}</p>` : ''}
        <p>Rental total: <strong>$${Number(b.rental_total_usd).toFixed(2)}</strong></p>
        <p>Deposit: $${Number(b.security_deposit_usd || 0).toFixed(2)}</p>
        <p>Total due: <strong>$${Number(b.total_due_usd || 0).toFixed(2)}</strong></p>
      </div>
    `;
  }

  let deliveryHtml = '';
  if (b.delivery_date_time || b.delivery_location_description || b.delivery_map_link) {
    deliveryHtml = `
      <div class="detail-section">
        <h4>Delivery Details</h4>
        ${b.delivery_date_time ? `<p>Date: ${new Date(b.delivery_date_time).toLocaleString()}</p>` : ''}
        ${b.delivery_location_description ? `<p>Location: ${b.delivery_location_description}</p>` : ''}
        ${b.delivery_map_link ? `<p><a href="${b.delivery_map_link}" target="_blank" rel="noopener">View on map</a></p>` : ''}
        ${b.delivered_at ? `<p>Delivered at: ${new Date(b.delivered_at).toLocaleString()}</p>` : ''}
      </div>
    `;
  }

  const contractHtml = b.contract_signed_at
    ? `<div class="detail-section"><h4>Contract</h4><p>Signed: ${new Date(b.contract_signed_at).toLocaleString()}</p>${b.typed_signature_name ? `<p>Signed by: ${b.typed_signature_name}</p>` : ''}</div>`
    : '';

  return `
    <div class="booking-detail-panel" id="detail-${b.id}" hidden>
      ${pricingHtml}
      ${deliveryHtml}
      ${contractHtml}
    </div>
  `;
}

function renderBookingCard(b: BookingWithMoto): string {
  const motoName = b.motorcycles
    ? `${b.motorcycles.brand} ${b.motorcycles.model}${b.motorcycles.registration_number ? ` — ${b.motorcycles.registration_number}` : ''}`
    : 'Unknown motorcycle';
  const nights = calculateNights(parseDate(b.start_date), parseDate(b.end_date));
  const contact = [b.customer_email, b.customer_whatsapp].filter(Boolean).join(' · ') || 'No contact info';
  const created = new Date(b.created_at).toLocaleDateString();

  return `
    <div class="booking-card" data-card-id="${b.id}">
      <div class="booking-card-header">
        <strong>${b.customer_name}</strong>
        <div class="booking-card-badges">
          ${renderBadge(b.status)}
        </div>
      </div>
      <div class="booking-card-details">
        <p>${contact}</p>
        <p>${motoName}</p>
        <p>${b.start_date} — ${b.end_date} (${nights} night${nights !== 1 ? 's' : ''})</p>
        <p>Reservation: <code>${b.reservation_code}</code></p>
        <p class="booking-card-created">Created: ${created}</p>
      </div>
      <button class="btn btn-sm detail-toggle-btn" data-detail-id="detail-${b.id}">Show Details</button>
      ${renderBookingDetail(b)}
      ${renderDeliveryStatus(b)}
      ${renderPaymentStatus(b)}
      ${renderActions(b)}
      ${renderReviewReminder(b)}
      <div class="booking-notes-section">${renderNotesSection(b)}</div>
    </div>
  `;
}

function renderReviewReminder(b: BookingWithMoto): string {
  if (b.status !== 'completed' || !b.customer_whatsapp) return '';
  const phone = b.customer_whatsapp.replace(/[^0-9+]/g, '');
  const reviewPart = REVIEW_LINK ? `\n\nLeave a review here: ${REVIEW_LINK}` : '';
  const msg = encodeURIComponent(
    `Hi ${b.customer_name}! Thanks for renting with us. We hope you enjoyed your ride! If you have a moment, we'd love your feedback.${reviewPart}`
  );
  return `
    <div class="review-reminder">
      <a href="https://wa.me/${phone}?text=${msg}" target="_blank" rel="noopener" class="btn btn-sm review-reminder-btn">Send Review Reminder</a>
    </div>
  `;
}

function renderStatusGroup(group: StatusGroup): string {
  if (group.bookings.length === 0) return '';
  const groupId = group.label.toLowerCase().replace(/[^a-z]+/g, '-');
  return `
    <div class="status-group" id="group-${groupId}">
      <h3 class="status-group-header collapsible-header" data-group="${groupId}">
        ${group.label} (${group.bookings.length})
        <span class="collapse-icon">&#9660;</span>
      </h3>
      <div class="status-group-body" id="group-body-${groupId}">
        ${group.bookings.map(renderBookingCard).join('')}
      </div>
    </div>
  `;
}

function groupBookings(bookings: BookingWithMoto[]): StatusGroup[] {
  return STATUS_GROUPS.map(g => ({
    ...g,
    bookings: bookings.filter(b => g.statuses.includes(b.status)),
  }));
}

function renderByMotorcycleView(bookings: BookingWithMoto[]): string {
  const motoMap = new Map<string, { name: string; bookings: BookingWithMoto[] }>();
  for (const b of bookings) {
    const motoId = b.motorcycle_id;
    const motoName = b.motorcycles
      ? `${b.motorcycles.brand} ${b.motorcycles.model}`
      : 'Unknown';
    if (!motoMap.has(motoId)) {
      motoMap.set(motoId, { name: motoName, bookings: [] });
    }
    motoMap.get(motoId)!.bookings.push(b);
  }

  const sections = Array.from(motoMap.entries()).map(([id, { name, bookings: motoBookings }]) => {
    const active = motoBookings.filter(b => b.status === 'active').length;
    const statusHint = active > 0 ? ` — <span class="status-badge badge-active">${active} active</span>` : '';
    return `
      <div class="status-group" id="moto-group-${id}">
        <h3 class="status-group-header collapsible-header" data-group="moto-${id}">
          ${name}${statusHint} (${motoBookings.length} booking${motoBookings.length !== 1 ? 's' : ''})
          <span class="collapse-icon">&#9660;</span>
        </h3>
        <div class="status-group-body" id="group-body-moto-${id}">
          ${motoBookings.map(renderBookingCard).join('')}
        </div>
      </div>
    `;
  }).join('');

  return sections || '<p class="admin-content">No bookings yet.</p>';
}

function getDeliveryDateRange(): [Date, Date] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (deliveryFilter === 'today') {
    const end = new Date(todayStart);
    end.setDate(end.getDate() + 1);
    return [todayStart, end];
  }
  if (deliveryFilter === 'tomorrow') {
    const start = new Date(todayStart);
    start.setDate(start.getDate() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return [start, end];
  }
  if (deliveryFilter === '7days') {
    const end = new Date(todayStart);
    end.setDate(end.getDate() + 7);
    return [todayStart, end];
  }
  // custom
  const start = deliveryCustomStart ? new Date(deliveryCustomStart) : todayStart;
  const end = deliveryCustomEnd ? new Date(deliveryCustomEnd + 'T23:59:59') : new Date(todayStart.getTime() + 86400000);
  return [start, end];
}

function formatDayHeader(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const todayStr = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = [tomorrowDate.getFullYear(), String(tomorrowDate.getMonth() + 1).padStart(2, '0'), String(tomorrowDate.getDate()).padStart(2, '0')].join('-');

  const formatted = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  if (dateStr === todayStr) return `Today &mdash; ${formatted}`;
  if (dateStr === tomorrowStr) return `Tomorrow &mdash; ${formatted}`;
  return formatted;
}

function renderDeliveryPreview(b: BookingWithMoto): string {
  const motoName = b.motorcycles
    ? `${b.motorcycles.brand} ${b.motorcycles.model}${b.motorcycles.registration_number ? ` — ${b.motorcycles.registration_number}` : ''}`
    : 'Unknown motorcycle';
  const nights = b.rental_days || calculateNights(parseDate(b.start_date), parseDate(b.end_date));

  let pricingHtml = '';
  if (b.rental_total_usd) {
    pricingHtml = `
      <p>${nights} days &times; $${(Number(b.base_price_usd || 0) / Math.max(nights, 1)).toFixed(0)}/day = $${Number(b.base_price_usd || 0).toFixed(2)}</p>
      ${b.discount_usd && Number(b.discount_usd) > 0 ? `<p>Discount: -$${Number(b.discount_usd).toFixed(2)}</p>` : ''}
      <p>Rental total: <strong>$${Number(b.rental_total_usd).toFixed(2)}</strong></p>
      <p>Deposit: $${Number(b.security_deposit_usd || 0).toFixed(2)}</p>
      <p>Total due: <strong>$${Number(b.total_due_usd || 0).toFixed(2)}</strong></p>
    `;
  }

  const contractHtml = b.contract_signed_at
    ? `<p>Signed: ${new Date(b.contract_signed_at).toLocaleString()}${b.typed_signature_name ? ` by ${b.typed_signature_name}` : ''}</p>`
    : '<p>Not yet signed</p>';

  return `
    <div class="delivery-preview-panel" id="delivery-preview-${b.id}" hidden>
      <div class="delivery-preview-content">
        <h4>Customer Reservation Preview</h4>
        <div class="detail-section">
          <p><strong>Customer:</strong> ${b.customer_name}</p>
          <p><strong>Email:</strong> ${b.customer_email || 'N/A'}</p>
          <p><strong>WhatsApp:</strong> ${b.customer_whatsapp || 'N/A'}</p>
        </div>
        <div class="detail-section">
          <p><strong>Motorcycle:</strong> ${motoName}</p>
          <p><strong>Dates:</strong> ${b.start_date} &rarr; ${b.end_date} (${nights} night${nights !== 1 ? 's' : ''})</p>
        </div>
        ${pricingHtml ? `<div class="detail-section"><h4>Pricing</h4>${pricingHtml}</div>` : ''}
        <div class="detail-section">
          <h4>Contract</h4>
          ${contractHtml}
        </div>
      </div>
    </div>
  `;
}

function renderDeliveryCard(b: BookingWithMoto): string {
  const motoName = b.motorcycles
    ? `${b.motorcycles.brand} ${b.motorcycles.model}`
    : 'Unknown';
  const deliveryTime = b.delivery_date_time
    ? new Date(b.delivery_date_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';
  const dStatus = b.delivery_status || 'scheduled';
  const dBadgeCls = DELIVERY_BADGE_COLORS[dStatus] || 'delivery-badge-scheduled';
  const dLabel = DELIVERY_LABELS[dStatus] || dStatus;
  const pBadgeCls = PAYMENT_BADGE_COLORS[b.payment_status || 'unpaid'] || 'badge-pending';

  return `
    <div class="delivery-card">
      <div class="delivery-card-header">
        <span class="delivery-card-time">${deliveryTime}</span>
        <span class="delivery-badge ${dBadgeCls}">${dLabel}</span>
      </div>
      <div class="delivery-card-body">
        <p><strong>${b.customer_name}</strong></p>
        <p>${motoName} &middot; <code>${b.reservation_code}</code></p>
        <p>${b.start_date} &rarr; ${b.end_date}</p>
        ${b.delivery_location_description ? `<p>${b.delivery_location_description}</p>` : ''}
        <p>
          ${b.payment_method || 'No payment method'}
          <span class="status-badge ${pBadgeCls}">${b.payment_status || 'unpaid'}</span>
          ${renderBadge(b.status)}
        </p>
      </div>
      <div class="delivery-card-actions">
        <button class="btn btn-sm delivery-action-btn delivery-preview-btn" data-preview-id="delivery-preview-${b.id}">Preview Reservation</button>
        ${b.customer_whatsapp ? `<button class="btn btn-sm delivery-action-btn" data-copy-whatsapp="${escapeAttr(b.customer_whatsapp)}" title="Copy WhatsApp">Copy WhatsApp</button>` : ''}
        ${b.delivery_map_link ? `<a href="${b.delivery_map_link}" target="_blank" rel="noopener" class="btn btn-sm delivery-action-btn">Open Map</a>` : ''}
        ${dStatus === 'scheduled' ? `<button class="btn btn-sm btn-primary delivery-action-btn" data-mark-delivered="${b.id}">Mark Delivered</button>` : ''}
        ${dStatus !== 'issue_reported' ? `<button class="btn btn-sm btn-danger delivery-action-btn" data-mark-issue="${b.id}">Mark Issue</button>` : ''}
      </div>
      ${renderDeliveryPreview(b)}
    </div>
  `;
}

function renderDeliveryBoard(bookings: BookingWithMoto[]): string {
  const [rangeStart, rangeEnd] = getDeliveryDateRange();

  const filtered = bookings.filter(b =>
    b.delivery_date_time &&
    b.status !== 'cancelled' &&
    new Date(b.delivery_date_time) >= rangeStart &&
    new Date(b.delivery_date_time) < rangeEnd
  );

  const dayGroups = new Map<string, BookingWithMoto[]>();
  for (const b of filtered) {
    const dt = new Date(b.delivery_date_time!);
    const dayKey = [dt.getFullYear(), String(dt.getMonth() + 1).padStart(2, '0'), String(dt.getDate()).padStart(2, '0')].join('-');
    if (!dayGroups.has(dayKey)) dayGroups.set(dayKey, []);
    dayGroups.get(dayKey)!.push(b);
  }

  const sortedDays = Array.from(dayGroups.keys()).sort();

  const filterBar = `
    <div class="delivery-filter-bar">
      <button class="btn btn-sm delivery-filter-btn${deliveryFilter === 'today' ? ' view-toggle-active' : ''}" data-delivery-filter="today">Today</button>
      <button class="btn btn-sm delivery-filter-btn${deliveryFilter === 'tomorrow' ? ' view-toggle-active' : ''}" data-delivery-filter="tomorrow">Tomorrow</button>
      <button class="btn btn-sm delivery-filter-btn${deliveryFilter === '7days' ? ' view-toggle-active' : ''}" data-delivery-filter="7days">Next 7 Days</button>
      <button class="btn btn-sm delivery-filter-btn${deliveryFilter === 'custom' ? ' view-toggle-active' : ''}" data-delivery-filter="custom">Custom</button>
    </div>
    ${deliveryFilter === 'custom' ? `
      <div class="delivery-custom-range">
        <input type="date" id="delivery-custom-start" value="${deliveryCustomStart}">
        <span>to</span>
        <input type="date" id="delivery-custom-end" value="${deliveryCustomEnd}">
        <button class="btn btn-sm btn-primary" id="delivery-custom-apply">Apply</button>
      </div>
    ` : ''}
  `;

  if (sortedDays.length === 0) {
    return `
      <div class="delivery-board">
        ${filterBar}
        <p class="delivery-empty">No deliveries scheduled for this period.</p>
      </div>
    `;
  }

  const dayHtml = sortedDays.map(day => {
    const dayBookings = dayGroups.get(day)!;
    dayBookings.sort((a, b) => new Date(a.delivery_date_time!).getTime() - new Date(b.delivery_date_time!).getTime());
    return `
      <div class="delivery-day-group">
        <h3 class="delivery-day-header">${formatDayHeader(day)} <span class="delivery-day-count">${dayBookings.length}</span></h3>
        ${dayBookings.map(renderDeliveryCard).join('')}
      </div>
    `;
  }).join('');

  return `
    <div class="delivery-board">
      ${filterBar}
      ${dayHtml}
    </div>
  `;
}

function renderDashboard(email: string, bookings: BookingWithMoto[]): string {
  if (bookings.length === 0) {
    return `
      ${renderHeader(email)}
      <div class="dashboard"><p class="admin-content">No bookings yet.</p></div>
    `;
  }

  const groups = groupBookings(bookings);
  let bodyContent: string;
  if (currentView === 'deliveries') {
    bodyContent = renderDeliveryBoard(bookings);
  } else if (currentView === 'motorcycle') {
    bodyContent = renderByMotorcycleView(bookings);
  } else {
    bodyContent = groups.map(renderStatusGroup).join('');
  }

  return `
    ${renderHeader(email)}
    <div class="dashboard">
      ${renderMetricsBar(bookings)}
      ${renderViewToggle()}
      ${bodyContent}
    </div>
  `;
}

// --- Mutations ---

async function updateStatus(bookingId: string, newStatus: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('bookings')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', bookingId);

  if (error) {
    alert('Failed to update status. Please try again.');
    return;
  }

  loadDashboard(currentEmail);
}

async function updateDeliveryStatus(bookingId: string, newStatus: string): Promise<void> {
  const updates: Record<string, unknown> = {
    delivery_status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (newStatus === 'delivered') {
    updates.delivered_at = new Date().toISOString();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('bookings')
    .update(updates)
    .eq('id', bookingId);

  if (error) {
    alert('Failed to update delivery status. Please try again.');
    return;
  }

  loadDashboard(currentEmail);
}

async function updatePaymentStatus(bookingId: string, newStatus: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('bookings')
    .update({ payment_status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', bookingId);

  if (error) {
    alert('Failed to update payment status. Please try again.');
    return;
  }

  loadDashboard(currentEmail);
}

async function saveNotes(bookingId: string, notes: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('bookings')
    .update({ manager_notes: notes || null, updated_at: new Date().toISOString() })
    .eq('id', bookingId);

  if (error) {
    alert('Failed to save notes. Please try again.');
    return;
  }

  loadDashboard(currentEmail);
}

// --- Event wiring ---

function wireActionButtons(): void {
  app!.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const bookingId = btn.dataset.bookingId!;
      const target = btn.dataset.action!;
      const isDanger = btn.dataset.danger === 'true';

      if (isDanger) {
        const confirmed = window.confirm(`Are you sure you want to ${target === 'rejected' ? 'reject' : 'cancel'} this booking?`);
        if (!confirmed) return;
      }

      updateStatus(bookingId, target);
    });
  });
}

function wireEditNotesButtons(): void {
  app!.querySelectorAll<HTMLButtonElement>('.edit-notes-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const bookingId = btn.dataset.bookingId!;
      const currentNotes = btn.dataset.notes ?? '';
      const section = btn.closest('.booking-notes-section');
      if (!section) return;

      section.innerHTML = `
        <div class="notes-edit">
          <textarea class="notes-textarea" rows="3">${currentNotes}</textarea>
          <div class="notes-edit-actions">
            <button class="btn btn-primary btn-sm save-notes-btn">Save</button>
            <button class="btn btn-sm cancel-notes-btn">Cancel</button>
          </div>
        </div>
      `;

      section.querySelector('.save-notes-btn')?.addEventListener('click', () => {
        const textarea = section.querySelector<HTMLTextAreaElement>('.notes-textarea');
        if (textarea) saveNotes(bookingId, textarea.value.trim());
      });

      section.querySelector('.cancel-notes-btn')?.addEventListener('click', () => {
        loadDashboard(currentEmail);
      });
    });
  });
}

function wireSignOut(): void {
  document.getElementById('signout-btn')?.addEventListener('click', () => {
    signOut();
  });
}

function wireDeliveryStatusDropdowns(): void {
  app!.querySelectorAll<HTMLSelectElement>('.delivery-status-select').forEach(select => {
    select.addEventListener('change', () => {
      const bookingId = select.dataset.bookingId!;
      const newStatus = select.value;
      if (newStatus === select.dataset.current) return;
      updateDeliveryStatus(bookingId, newStatus);
    });
  });
}

function wirePaymentStatusDropdowns(): void {
  app!.querySelectorAll<HTMLSelectElement>('.payment-status-select').forEach(select => {
    select.addEventListener('change', () => {
      const bookingId = select.dataset.bookingId!;
      const newStatus = select.value;
      if (newStatus === select.dataset.current) return;
      updatePaymentStatus(bookingId, newStatus);
    });
  });
}

function wireDetailToggles(): void {
  app!.querySelectorAll<HTMLButtonElement>('.detail-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const detailId = btn.dataset.detailId!;
      const panel = document.getElementById(detailId);
      if (!panel) return;
      const isHidden = panel.hidden;
      panel.hidden = !isHidden;
      btn.textContent = isHidden ? 'Hide Details' : 'Show Details';
    });
  });
}

function wireCollapsibleHeaders(): void {
  app!.querySelectorAll<HTMLElement>('.collapsible-header').forEach(header => {
    header.addEventListener('click', () => {
      const groupId = header.dataset.group!;
      const body = document.getElementById(`group-body-${groupId}`);
      const icon = header.querySelector('.collapse-icon');
      if (!body) return;
      const isHidden = body.style.display === 'none';
      body.style.display = isHidden ? '' : 'none';
      if (icon) icon.innerHTML = isHidden ? '&#9660;' : '&#9654;';
    });
  });
}

function wireViewToggle(): void {
  app!.querySelectorAll<HTMLButtonElement>('.view-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view as 'status' | 'motorcycle' | 'deliveries';
      if (view === currentView) return;
      currentView = view;
      loadDashboard(currentEmail);
    });
  });
}

function wireDeliveryBoard(): void {
  // Filter buttons
  app!.querySelectorAll<HTMLButtonElement>('[data-delivery-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      deliveryFilter = btn.dataset.deliveryFilter as typeof deliveryFilter;
      loadDashboard(currentEmail);
    });
  });

  // Custom range apply
  document.getElementById('delivery-custom-apply')?.addEventListener('click', () => {
    const startEl = document.getElementById('delivery-custom-start') as HTMLInputElement | null;
    const endEl = document.getElementById('delivery-custom-end') as HTMLInputElement | null;
    if (startEl) deliveryCustomStart = startEl.value;
    if (endEl) deliveryCustomEnd = endEl.value;
    loadDashboard(currentEmail);
  });

  // Copy WhatsApp
  app!.querySelectorAll<HTMLButtonElement>('[data-copy-whatsapp]').forEach(btn => {
    btn.addEventListener('click', () => {
      const phone = btn.dataset.copyWhatsapp!;
      navigator.clipboard.writeText(phone).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy WhatsApp'; }, 1500);
      });
    });
  });

  // Mark Delivered
  app!.querySelectorAll<HTMLButtonElement>('[data-mark-delivered]').forEach(btn => {
    btn.addEventListener('click', () => {
      updateDeliveryStatus(btn.dataset.markDelivered!, 'delivered');
    });
  });

  // Mark Issue
  app!.querySelectorAll<HTMLButtonElement>('[data-mark-issue]').forEach(btn => {
    btn.addEventListener('click', () => {
      updateDeliveryStatus(btn.dataset.markIssue!, 'issue_reported');
    });
  });

  // Preview Reservation toggle
  app!.querySelectorAll<HTMLButtonElement>('.delivery-preview-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const previewId = btn.dataset.previewId!;
      const panel = document.getElementById(previewId);
      if (!panel) return;
      const isHidden = panel.hidden;
      panel.hidden = !isHidden;
      btn.textContent = isHidden ? 'Hide Preview' : 'Preview Reservation';
    });
  });

  // Metric card click to jump to deliveries
  document.getElementById('metric-deliveries')?.addEventListener('click', () => {
    if (currentView !== 'deliveries') {
      currentView = 'deliveries';
      loadDashboard(currentEmail);
    }
  });
}

function wireDashboardEvents(): void {
  wireSignOut();
  wireActionButtons();
  wireEditNotesButtons();
  wireDeliveryStatusDropdowns();
  wirePaymentStatusDropdowns();
  wireDetailToggles();
  wireCollapsibleHeaders();
  wireViewToggle();
  wireDeliveryBoard();
}

// --- Data + view ---

async function loadDashboard(email: string): Promise<void> {
  currentEmail = email;
  app!.innerHTML = renderDashboardLoading(email);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('bookings')
    .select('*, motorcycles(name, brand, model, registration_number)')
    .order('start_date', { ascending: true }) as { data: BookingWithMoto[] | null; error: { message: string } | null };

  if (error) {
    app!.innerHTML = renderDashboardError(email);
    wireSignOut();
    return;
  }

  app!.innerHTML = renderDashboard(email, data ?? []);
  wireDashboardEvents();
}

function renderView(session: Session | null): void {
  const user = getUser(session);

  if (user) {
    if (user.email?.toLowerCase() === MANAGER_EMAIL.toLowerCase()) {
      showingUnauthorized = false;
      loadDashboard(user.email!);
    } else {
      showingUnauthorized = true;
      signOut();
      app!.innerHTML = renderUnauthorized(user.email ?? 'unknown');
      document.getElementById('signin-btn')?.addEventListener('click', () => {
        showingUnauthorized = false;
        signInWithGoogle();
      });
    }
  } else {
    if (showingUnauthorized) return;
    app!.innerHTML = renderSignedOut();
    document.getElementById('signin-btn')?.addEventListener('click', () => {
      signInWithGoogle();
    });
  }
}

async function init(): Promise<void> {
  app!.innerHTML = renderLoading();

  const session = await getSession();
  renderView(session);

  onAuthStateChange((_event, session) => {
    renderView(session);
  });
}

init();
