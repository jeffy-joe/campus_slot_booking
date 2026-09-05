export type ActivityCategory = 'indoor' | 'turf';

export interface SportActivity {
  id: string;
  name: string;
  category: ActivityCategory;
  description: string;
  iconName: string;
  defaultVenue: string;
  availableVenues: string[];
  durationMinutes: number;
  maxPlayers: number;
  popular?: boolean;
}

export interface TimeSlot {
  id: string;
  timeRange: string; // e.g. "08:00 AM - 09:00 AM"
  startTime: string; // "08:00"
  endTime: string;   // "09:00"
  isBooked?: boolean;
}

export interface Booking {
  id: string; // e.g. TT3108260300
  activityId: string;
  activityName: string;
  category: ActivityCategory;
  dateString: string; // e.g. "Sun, 31 Aug 2026"
  dateKey: string;    // e.g. "2026-08-31"
  timeSlot: string;   // e.g. "03:00 PM - 04:00 PM"
  venue: string;      // e.g. "Indoor Sports Room 2"
  userName: string;   // e.g. "Rahul Sharma"
  registrationNumber: string; // e.g. "22BCE1042"
  userEmail: string;  // e.g. "yourname@gmail.com"
  userId?: string;    // e.g. "user-17885..."
  bookedAt: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  emailDeliveryStatus?: 'sent' | 'failed' | 'simulated';
  emailPreviewUrl?: string;
  emailError?: string;
  emailSender?: string;
  cancellationReason?: string;
  cancelledBy?: 'admin' | 'user';
  cancelledAt?: string;
  cancellationEmailStatus?: 'sent' | 'failed' | 'simulated';
  cancellationEmailError?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  registrationNumber?: string;
  isGuest?: boolean;
  isVerified?: boolean;
  isAdmin?: boolean;
}

export type AdminTab = 'dashboard' | 'bookings' | 'restrict-slots' | 'announcements';

export interface SlotRestriction {
  id: string;
  facilityCategory: 'indoor' | 'turf' | 'all';
  facilityName: string;
  activityId?: string;    // e.g. 'carrom', 'chess', 'cricket-nets', 'pickle-ball', or 'all'
  activityName?: string;  // e.g. 'Carrom', 'Chess', 'Cricket Nets', 'All Games'
  type: 'date' | 'slot';
  dateKey: string;     // e.g. "2026-08-31"
  dateString: string;  // e.g. "31 Aug 2026"
  timeSlot: string;    // e.g. "03:00 PM - 06:00 PM" or "All Day"
  reason: 'Maintenance' | 'Event' | 'Holiday' | 'Weather' | 'Other';
  description?: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'High' | 'Medium' | 'Low';
  publishDate: string; // e.g. "30 Aug 2026, 09:00 AM"
  isActive: boolean;
  createdAt: string;
}

export type ViewType = 
  | 'login'
  | 'signup'
  | 'verify'
  | 'dashboard'
  | 'indoor-games'
  | 'turf-grounds'
  | 'booking-status'
  | 'announcements'
  | 'slot-selection'
  | 'confirm-booking'
  | 'booking-confirmed'
  | 'admin';


