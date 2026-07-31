export type Role = 'admin' | 'barbeiro' | 'cliente';
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface Barber {
  id: string;
  name: string;
  photo: string | null;
  description: string | null;
  specialties: string[];
  rating: number;
  active: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  image: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  barber_id: string;
  service_id: string;
  date: string;
  time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  barber?: Barber;
  service?: Service;
  profile?: Profile;
}

export interface Review {
  id: string;
  user_id: string;
  barber_id: string;
  appointment_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  profile?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: string;
  read: boolean;
  created_at: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number | null;
  code: string | null;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export interface BarberAvailability {
  id: string;
  barber_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
}

export interface BlockedSlot {
  id: string;
  barber_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}
