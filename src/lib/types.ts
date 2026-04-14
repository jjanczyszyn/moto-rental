export interface Motorcycle {
  id: string;
  slug: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  dailyRate: number;
  description: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  registrationNumber: string | null;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

export interface Booking {
  id: string;
  motorcycleId: string;
  reservationCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startDate: string;
  endDate: string;
  nights: number;
  totalPrice: number;
  status: BookingStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingRequestParams {
  motorcycleId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startDate: string;
  endDate: string;
}

export interface BookingRequestResult {
  reservationCode: string;
  bookingId: string;
}
