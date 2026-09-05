import { useState, useEffect } from 'react';
import type { ViewType, SportActivity, Booking, User } from './types';
import { ACTIVITIES, getLiveBookingDates } from './data/sportsData';
import type { AvailableDate } from './data/sportsData';
import { useBookingStore } from './store/bookingStore';
import { useAuthStore } from './store/authStore';

// Components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

// Views
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { IndoorGamesView } from './views/IndoorGamesView';
import { TurfGroundsView } from './views/TurfGroundsView';
import { SlotSelectionView } from './views/SlotSelectionView';
import { ConfirmBookingView } from './views/ConfirmBookingView';
import { BookingConfirmedView } from './views/BookingConfirmedView';
import { BookingStatusView } from './views/BookingStatusView';
import { StudentAnnouncementsView } from './views/StudentAnnouncementsView';
import { AdminPortalView } from './views/admin/AdminPortalView';

const VALID_VIEWS: ViewType[] = [
  'login',
  'signup',
  'verify',
  'dashboard',
  'indoor-games',
  'turf-grounds',
  'booking-status',
  'announcements',
  'slot-selection',
  'confirm-booking',
  'booking-confirmed',
  'admin',
];

const VIEW_STORAGE_KEY = 'campus_sports_current_view_v3';
const SPORT_STORAGE_KEY = 'campus_sports_active_sport_id_v3';
const SLOT_STORAGE_KEY = 'campus_sports_active_slot_details_v3';
const SEARCH_ID_STORAGE_KEY = 'campus_sports_active_search_id_v3';
const CONFIRMED_BOOKING_KEY = 'campus_sports_confirmed_booking_v3';

function resolveInitialView(user: User | null): ViewType {
  const hasUser = Boolean(user);
  const isAdmin = user?.isAdmin || user?.email === 'admin@campus.com';

  if (isAdmin) {
    return 'admin';
  }

  // 1. Check window.location.hash (e.g. #indoor-games, #signup, #verify, #admin/bookings)
  if (typeof window !== 'undefined' && window.location.hash) {
    const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
    if (rawHash.startsWith('admin')) {
      return isAdmin ? 'admin' : (hasUser ? 'dashboard' : 'login');
    }
    if (VALID_VIEWS.includes(rawHash as ViewType)) {
      if (rawHash === 'admin' && !isAdmin) {
        return hasUser ? 'dashboard' : 'login';
      }
      if (!hasUser && !['login', 'signup', 'verify'].includes(rawHash)) {
        return 'login';
      }
      return rawHash as ViewType;
    }
  }

  // 2. Check localStorage for last active view
  try {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY) as ViewType;
    if (saved && VALID_VIEWS.includes(saved)) {
      if (saved === 'admin' && !isAdmin) {
        return hasUser ? 'dashboard' : 'login';
      }
      if (!hasUser && !['login', 'signup', 'verify'].includes(saved)) {
        return 'login';
      }
      return saved;
    }
  } catch (e) {
    console.error('Failed to restore view from storage', e);
  }

  // 3. Default fallback based on login state
  return hasUser ? 'dashboard' : 'login';
}

export function App() {
  const { currentUser, logout } = useAuthStore();

  // Preserved active view on refresh
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    return resolveInitialView(currentUser);
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Preserved active sport selection on refresh
  const [selectedSport, setSelectedSport] = useState<SportActivity>(() => {
    try {
      const savedSportId = localStorage.getItem(SPORT_STORAGE_KEY);
      if (savedSportId) {
        const found = ACTIVITIES.find(a => a.id === savedSportId);
        if (found) return found;
      }
    } catch (e) {
      console.error('Failed to restore sport', e);
    }
    return ACTIVITIES.find(a => a.id === 'table-tennis') || ACTIVITIES[0];
  });

  // Preserved active slot selection on refresh
  const [slotDetails, setSlotDetails] = useState<{
    sport: SportActivity;
    date: AvailableDate;
    timeSlot: string;
  }>(() => {
    try {
      const saved = localStorage.getItem(SLOT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.sport && parsed?.date && parsed?.timeSlot) {
          // Discard saved date if it's in the past — always use today's live date
          const today = getLiveBookingDates(1)[0];
          if (parsed.date.dateKey < today.dateKey) {
            return { sport: parsed.sport, date: today, timeSlot: parsed.timeSlot };
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to restore slot details', e);
    }
    return {
      sport: selectedSport,
      date: getLiveBookingDates(1)[0],
      timeSlot: '03:00 PM - 04:00 PM',
    };
  });

  // Preserved confirmed booking receipt on refresh
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(() => {
    try {
      const saved = localStorage.getItem(CONFIRMED_BOOKING_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to restore confirmed booking', e);
    }
    return null;
  });

  // Preserved search ID for Booking Status view
  const [searchBookingId, setSearchBookingId] = useState<string>(() => {
    try {
      return localStorage.getItem(SEARCH_ID_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  // Store
  const {
    bookings,
    createBooking,
    updateBookingEmailStatus,
    cancelBooking,
    isSlotBooked,
    getBookingById,
    getUserBookings,
  } = useBookingStore();

  // Navigation handlers with persistence to URL Hash & localStorage
  const handleNavigate = (view: ViewType) => {
    setCurrentView(view);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
      if (typeof window !== 'undefined') {
        window.location.hash = view;
      }
    } catch (e) {
      console.error('Failed to persist view', e);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync state changes with storage
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, currentView);
      if (typeof window !== 'undefined') {
        const currentHash = window.location.hash.replace(/^#\/?/, '');
        // If we are in admin view and hash already has admin/subtab, don't overwrite it with bare 'admin'
        if (currentView === 'admin' && currentHash.startsWith('admin/')) {
          // preserve sub-path
        } else if (currentHash !== currentView) {
          window.location.hash = currentView;
        }
      }
    } catch (e) {
      console.error('Failed to sync view', e);
    }
  }, [currentView]);

  // Sync sport selection
  useEffect(() => {
    try {
      localStorage.setItem(SPORT_STORAGE_KEY, selectedSport.id);
    } catch (e) {
      console.error('Failed to sync sport', e);
    }
  }, [selectedSport]);

  // Sync slot details
  useEffect(() => {
    try {
      localStorage.setItem(SLOT_STORAGE_KEY, JSON.stringify(slotDetails));
    } catch (e) {
      console.error('Failed to sync slot details', e);
    }
  }, [slotDetails]);

  // Sync confirmed booking
  useEffect(() => {
    try {
      if (confirmedBooking) {
        localStorage.setItem(CONFIRMED_BOOKING_KEY, JSON.stringify(confirmedBooking));
      } else {
        localStorage.removeItem(CONFIRMED_BOOKING_KEY);
      }
    } catch (e) {
      console.error('Failed to sync confirmed booking', e);
    }
  }, [confirmedBooking]);

  // Sync search ID
  useEffect(() => {
    try {
      localStorage.setItem(SEARCH_ID_STORAGE_KEY, searchBookingId);
    } catch (e) {
      console.error('Failed to sync search ID', e);
    }
  }, [searchBookingId]);

  // Handle browser Back / Forward history navigation
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
      const isAdmin = currentUser?.isAdmin || currentUser?.email === 'admin@campus.com';

      if (rawHash.startsWith('admin')) {
        if (isAdmin) {
          setCurrentView('admin');
        } else {
          setCurrentView(currentUser ? 'dashboard' : 'login');
        }
        return;
      }

      if (VALID_VIEWS.includes(rawHash as ViewType)) {
        if (!currentUser && !['login', 'signup', 'verify'].includes(rawHash)) {
          setCurrentView('login');
        } else {
          setCurrentView(rawHash as ViewType);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser]);

  const handleSignOut = () => {
    logout();
    handleNavigate('login');
  };

  const handleSelectSport = (sport: SportActivity) => {
    setSelectedSport(sport);
    setSlotDetails(prev => ({
      ...prev,
      sport,
    }));
    handleNavigate('slot-selection');
  };

  const handleSlotContinue = (details: {
    sport: SportActivity;
    date: AvailableDate;
    timeSlot: string;
  }) => {
    setSlotDetails(details);
    handleNavigate('confirm-booking');
  };

  const handleConfirmBooking = (params: {
    sport: SportActivity;
    dateString: string;
    dateKey: string;
    timeSlot: string;
    venue: string;
    userName: string;
    registrationNumber: string;
    userEmail: string;
    userId?: string;
    emailDeliveryStatus?: 'sent' | 'failed' | 'simulated';
    emailPreviewUrl?: string;
    emailError?: string;
    emailSender?: string;
  }) => {
    const newBooking = createBooking({
      ...params,
      userId: params.userId || currentUser?.id,
    });
    setConfirmedBooking(newBooking);
    handleNavigate('booking-confirmed');
  };

  const handleCheckBookingFromDashboard = (bookingId: string) => {
    setSearchBookingId(bookingId);
    handleNavigate('booking-status');
  };

  // Render standalone AuthView when user is in login/signup/verify or unauthenticated
  if (
    currentView === 'login' ||
    currentView === 'signup' ||
    currentView === 'verify' ||
    !currentUser
  ) {
    const authMode = (['login', 'signup', 'verify'].includes(currentView)
      ? currentView
      : 'login') as 'login' | 'signup' | 'verify';

    return (
      <AuthView
        initialMode={authMode}
        onAuthSuccess={authenticatedUser => {
          const user = authenticatedUser || currentUser;
          const isAdmin = user?.isAdmin || user?.email === 'admin@campus.com';
          if (isAdmin) {
            handleNavigate('admin');
          } else {
            handleNavigate('dashboard');
          }
        }}
        onContinueGuest={() => handleNavigate('dashboard')}
        onNavigateMode={mode => handleNavigate(mode)}
      />
    );
  }

  // Render dedicated full-screen Admin Portal View (strictly restricted to admin@campus.com)
  if (currentView === 'admin') {
    const isAdmin = currentUser?.isAdmin || currentUser?.email === 'admin@campus.com';
    if (!isAdmin) {
      handleNavigate(currentUser ? 'dashboard' : 'login');
      return null;
    }

    return (
      <AdminPortalView
        onExitAdmin={handleSignOut}
        bookings={bookings}
        onCancelBooking={(id, reason, emailStatus, emailError) =>
          cancelBooking(id, reason, 'admin', emailStatus, emailError)
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col md:flex-row">
      {/* Persistent Left Sidebar (Drawer on mobile, fixed sidebar on desktop) */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0 w-full">
        {/* Top Header with Hamburger for mobile and active user profile */}
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          activeDateString={slotDetails.date.fullDateString}
          currentUser={currentUser}
          onOpenLogin={() => handleNavigate('login')}
          onSignOut={handleSignOut}
        />

        {/* View Switcher with responsive container padding */}
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={handleNavigate}
              onSelectSport={handleSelectSport}
              onCheckBooking={handleCheckBookingFromDashboard}
            />
          )}

          {currentView === 'indoor-games' && (
            <IndoorGamesView onSelectSport={handleSelectSport} />
          )}

          {currentView === 'turf-grounds' && (
            <TurfGroundsView onSelectSport={handleSelectSport} />
          )}

          {currentView === 'slot-selection' && (
            <SlotSelectionView
              sport={selectedSport}
              onBack={() =>
                handleNavigate(
                  selectedSport.category === 'indoor'
                    ? 'indoor-games'
                    : 'turf-grounds'
                )
              }
              onContinue={handleSlotContinue}
              isSlotBooked={isSlotBooked}
            />
          )}

          {currentView === 'confirm-booking' && (
            <ConfirmBookingView
              sport={slotDetails.sport}
              date={slotDetails.date}
              timeSlot={slotDetails.timeSlot}
              currentUser={currentUser}
              onBack={() => handleNavigate('slot-selection')}
              onConfirm={handleConfirmBooking}
            />
          )}

          {currentView === 'booking-confirmed' && confirmedBooking && (
            <BookingConfirmedView
              booking={confirmedBooking}
              onNavigate={handleNavigate}
              onBookAnother={() =>
                handleNavigate(
                  confirmedBooking.category === 'indoor'
                    ? 'indoor-games'
                    : 'turf-grounds'
                )
              }
            />
          )}

          {currentView === 'booking-status' && (
            <BookingStatusView
              initialSearchId={searchBookingId}
              currentUser={currentUser}
              userBookings={getUserBookings(currentUser?.email, currentUser?.id)}
              onNavigate={handleNavigate}
              getBookingById={getBookingById}
              cancelBooking={cancelBooking}
              onUpdateEmailStatus={updateBookingEmailStatus}
              onSelectSport={handleSelectSport}
            />
          )}

          {currentView === 'announcements' && (
            <StudentAnnouncementsView onNavigate={handleNavigate} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
