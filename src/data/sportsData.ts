import type { SportActivity, TimeSlot } from '../types';

export const ACTIVITIES: SportActivity[] = [
  // Indoor Games
  {
    id: 'carrom',
    name: 'Carrom',
    category: 'indoor',
    description: 'Book a slot to play carrom with your friends.',
    iconName: 'carrom',
    defaultVenue: 'Indoor Sports Hall - Board 1',
    availableVenues: ['Indoor Sports Hall - Board 1', 'Indoor Sports Hall - Board 2', 'Student Recreation Center'],
    durationMinutes: 60,
    maxPlayers: 4,
    popular: true,
  },
  {
    id: 'table-tennis',
    name: 'Table Tennis',
    category: 'indoor',
    description: 'Book a slot to enjoy table tennis games.',
    iconName: 'table-tennis',
    defaultVenue: 'Indoor Sports Room 2',
    availableVenues: ['Indoor Sports Room 1', 'Indoor Sports Room 2', 'Recreation Center Court 1'],
    durationMinutes: 60,
    maxPlayers: 4,
    popular: true,
  },
  {
    id: 'chess',
    name: 'Chess',
    category: 'indoor',
    description: 'Challenge your friends in a game of chess.',
    iconName: 'chess',
    defaultVenue: 'Mind Sports Lounge - Table 3',
    availableVenues: ['Mind Sports Lounge - Table 1', 'Mind Sports Lounge - Table 2', 'Mind Sports Lounge - Table 3'],
    durationMinutes: 60,
    maxPlayers: 2,
    popular: true,
  },
  {
    id: 'table-soccer',
    name: 'Table Soccer',
    category: 'indoor',
    description: 'Enjoy exciting table soccer matches.',
    iconName: 'table-soccer',
    defaultVenue: 'Student Lounge Foosball Arena',
    availableVenues: ['Student Lounge Foosball Arena', 'Indoor Games Arena 2'],
    durationMinutes: 60,
    maxPlayers: 4,
    popular: false,
  },

  // Turf & Grounds
  {
    id: 'futsal',
    name: 'Futsal',
    category: 'turf',
    description: 'Book the futsal ground for your team.',
    iconName: 'futsal',
    defaultVenue: 'Campus Turf Ground A',
    availableVenues: ['Campus Turf Ground A', 'South Campus Mini Turf'],
    durationMinutes: 60,
    maxPlayers: 10,
    popular: true,
  },
  {
    id: 'pickle-ball',
    name: 'Pickle Ball',
    category: 'turf',
    description: 'Book a pickle ball court for your game.',
    iconName: 'pickle-ball',
    defaultVenue: 'Outdoor Pickleball Court 1',
    availableVenues: ['Outdoor Pickleball Court 1', 'Outdoor Pickleball Court 2'],
    durationMinutes: 60,
    maxPlayers: 4,
    popular: false,
  },
  {
    id: 'cricket-nets',
    name: 'Cricket Nets',
    category: 'turf',
    description: 'Practice your game in the cricket nets.',
    iconName: 'cricket-nets',
    defaultVenue: 'Main Cricket Practice Nets - Pitch 2',
    availableVenues: ['Main Cricket Practice Nets - Pitch 1', 'Main Cricket Practice Nets - Pitch 2'],
    durationMinutes: 60,
    maxPlayers: 8,
    popular: true,
  },
  {
    id: 'volleyball',
    name: 'Volleyball',
    category: 'turf',
    description: 'Book the volleyball court for your match.',
    iconName: 'volleyball',
    defaultVenue: 'Campus Sand Volleyball Court',
    availableVenues: ['Campus Sand Volleyball Court', 'Hard Court Volleyball Area'],
    durationMinutes: 60,
    maxPlayers: 12,
    popular: true,
  },
];

export const STANDARD_TIME_SLOTS: TimeSlot[] = [
  { id: '10-11', timeRange: '10:00 AM - 11:00 AM', startTime: '10:00', endTime: '11:00' },
  { id: '11-12', timeRange: '11:00 AM - 12:00 PM', startTime: '11:00', endTime: '12:00' },
  { id: '12-01', timeRange: '12:00 PM - 01:00 PM', startTime: '12:00', endTime: '13:00' },
  { id: '01-02', timeRange: '01:00 PM - 02:00 PM', startTime: '13:00', endTime: '14:00' },
  { id: '02-03', timeRange: '02:00 PM - 03:00 PM', startTime: '14:00', endTime: '15:00' },
  { id: '03-04', timeRange: '03:00 PM - 04:00 PM', startTime: '15:00', endTime: '16:00' },
  { id: '04-05', timeRange: '04:00 PM - 05:00 PM', startTime: '16:00', endTime: '17:00' },
  { id: '05-06', timeRange: '05:00 PM - 06:00 PM', startTime: '17:00', endTime: '18:00' },
];

export function isDateToday(dateKey: string, now: Date = new Date()): boolean {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return dateKey === `${year}-${month}-${day}`;
}

export function isSlotUpcoming(slot: TimeSlot, isToday: boolean, now: Date = new Date()): boolean {
  if (!isToday) return true; // Future dates show all slots

  const [slotHourStr, slotMinStr] = slot.startTime.split(':');
  const slotHour = parseInt(slotHourStr, 10);
  const slotMin = parseInt(slotMinStr || '0', 10);

  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  if (slotHour > currentHour) return true;
  if (slotHour === currentHour && slotMin > currentMin) return true;

  return false;
}

export function parseSlotStartTime(timeSlot: string): { hour: number; minute: number } | null {
  const parts = timeSlot.split('-');
  if (parts.length < 1) return null;
  const startPart = parts[0].trim();
  const match = startPart.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }

  return { hour, minute };
}

export function parseSlotEndTime(timeSlot: string): { hour: number; minute: number } | null {
  const parts = timeSlot.split('-');
  if (parts.length < 2) return null;
  const endPart = parts[1].trim();
  const match = endPart.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }

  return { hour, minute };
}

export function isBookingUpcoming(booking: { dateKey?: string; timeSlot: string }, now: Date = new Date()): boolean {
  if (!booking.dateKey) return false;

  const [bYearStr, bMonthStr, bDayStr] = booking.dateKey.split('-');
  const bYear = parseInt(bYearStr, 10);
  const bMonth = parseInt(bMonthStr, 10) - 1;
  const bDay = parseInt(bDayStr, 10);

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  const bookingDate = new Date(bYear, bMonth, bDay);
  const todayDate = new Date(currentYear, currentMonth, currentDay);

  // Past dates -> strictly not upcoming
  if (bookingDate < todayDate) {
    return false;
  }

  // Future dates -> upcoming
  if (bookingDate > todayDate) {
    return true;
  }

  // Today: check slot start time. If slot has already started or ended, it is NOT upcoming.
  // E.g., if current time is 3:00 PM, 10:00 AM - 03:00 PM slots are NOT upcoming.
  const startTime = parseSlotStartTime(booking.timeSlot);
  if (!startTime) return false;

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (startTime.hour > currentHour) return true;
  if (startTime.hour === currentHour && startTime.minute > currentMinute) return true;

  return false;
}

export function isBookingEnded(booking: { dateKey?: string; timeSlot: string }, now: Date = new Date()): boolean {
  if (!booking.dateKey) return false;

  const [bYearStr, bMonthStr, bDayStr] = booking.dateKey.split('-');
  const bYear = parseInt(bYearStr, 10);
  const bMonth = parseInt(bMonthStr, 10) - 1;
  const bDay = parseInt(bDayStr, 10);

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  const bookingDate = new Date(bYear, bMonth, bDay);
  const todayDate = new Date(currentYear, currentMonth, currentDay);

  // Past day
  if (bookingDate < todayDate) {
    return true;
  }

  // Future day
  if (bookingDate > todayDate) {
    return false;
  }

  // Today: check if slot end time has passed
  const endTime = parseSlotEndTime(booking.timeSlot);
  if (!endTime) return false;

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (endTime.hour < currentHour) return true;
  if (endTime.hour === currentHour && endTime.minute <= currentMinute) return true;

  return false;
}

export interface AvailableDate {
  dateKey: string;     // YYYY-MM-DD
  dayName: string;     // "Today", "Fri", "Sat", etc.
  dayNumber: string;   // "3", "4", etc.
  monthShort: string;  // "Sep", "Oct", etc.
  fullDateString: string; // "Thu, 3 Sep 2026"
  isToday?: boolean;
}

// Dynamically generate real-world live calendar dates starting from today
export function getLiveBookingDates(daysCount: number = 14): AvailableDate[] {
  const dates: AvailableDate[] = [];
  const now = new Date();

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayName = i === 0 ? 'Today' : weekday;
    const dayNumber = String(d.getDate());
    const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
    const fullDateString = `${weekday}, ${d.getDate()} ${monthShort} ${year}`;

    dates.push({
      dateKey,
      dayName,
      dayNumber,
      monthShort,
      fullDateString,
      isToday: i === 0,
    });
  }

  return dates;
}

export const INITIAL_DATE_RANGE: AvailableDate[] = getLiveBookingDates(14);

