import { supabase } from './lib/supabase';
import { signInWithGoogle, signOut, getSession, getUser, onAuthStateChange } from './lib/auth';
import { MANAGER_EMAIL } from './lib/config';
import { parseDate, calculateNights } from './lib/utils';
import type { Database } from './lib/database.types';
import type { Session } from '@supabase/supabase-js';

type Booking = Database['public']['Tables']['bookings']['Row'];

interface BookingWithMoto extends Booking {
  motorcycles: { name: string; brand: string; model: string } | null;
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

let currentEmail = '';
let showingUnauthorized = false;

const app = document.getElementById('app');
if (!app) throw new Error('Missing <div id="app"> element');

// --- Render helpers ---

function renderHeader(email?: string): string {
  if (email) {
    return `
      <div class="admin-header">
        <h1>Moto Rental — Admin</h1>
        <div class="admin-user">
          <span class="admin-email">${email}</span>
          <button class="btn" id="signout-btn">Sign Out</button>
        </div>
      </div>
    `;
  }
  return '<div class="admin-header"><h1>Moto Rental — Admin</h1></div>';
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

function renderBookingCard(b: BookingWithMoto): string {
  const motoName = b.motorcycles
    ? `${b.motorcycles.brand} ${b.motorcycles.model} (${b.motorcycles.name})`
    : 'Unknown motorcycle';
  const nights = calculateNights(parseDate(b.start_date), parseDate(b.end_date));
  const contact = [b.customer_email, b.customer_whatsapp].filter(Boolean).join(' · ') || 'No contact info';
  const created = new Date(b.created_at).toLocaleDateString();

  return `
    <div class="booking-card" data-card-id="${b.id}">
      <div class="booking-card-header">
        <strong>${b.customer_name}</strong>
        ${renderBadge(b.status)}
      </div>
      <div class="booking-card-details">
        <p>${contact}</p>
        <p>${motoName}</p>
        <p>${b.start_date} — ${b.end_date} (${nights} night${nights !== 1 ? 's' : ''})</p>
        <p>Reservation: <code>${b.reservation_code}</code></p>
        <p class="booking-card-created">Created: ${created}</p>
      </div>
      ${renderActions(b)}
      <div class="booking-notes-section">${renderNotesSection(b)}</div>
    </div>
  `;
}

function renderStatusGroup(group: StatusGroup): string {
  if (group.bookings.length === 0) return '';
  return `
    <div class="status-group">
      <h3 class="status-group-header">${group.label} (${group.bookings.length})</h3>
      ${group.bookings.map(renderBookingCard).join('')}
    </div>
  `;
}

function groupBookings(bookings: BookingWithMoto[]): StatusGroup[] {
  return STATUS_GROUPS.map(g => ({
    ...g,
    bookings: bookings.filter(b => g.statuses.includes(b.status)),
  }));
}

function renderDashboard(email: string, bookings: BookingWithMoto[]): string {
  if (bookings.length === 0) {
    return `
      ${renderHeader(email)}
      <div class="dashboard"><p class="admin-content">No bookings yet.</p></div>
    `;
  }

  const groups = groupBookings(bookings);
  return `
    ${renderHeader(email)}
    <div class="dashboard">
      ${groups.map(renderStatusGroup).join('')}
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

function wireDashboardEvents(): void {
  wireSignOut();
  wireActionButtons();
  wireEditNotesButtons();
}

// --- Data + view ---

async function loadDashboard(email: string): Promise<void> {
  currentEmail = email;
  app!.innerHTML = renderDashboardLoading(email);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('bookings')
    .select('*, motorcycles(name, brand, model)')
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
