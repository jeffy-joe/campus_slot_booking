import React, { useState } from 'react';
import { ArrowRight, ChevronLeft, Mail, ShieldCheck, Calendar, Clock, User, Hash, Loader2 } from 'lucide-react';
import type { SportActivity, User as UserType } from '../types';
import { SportIconRenderer } from '../components/SportIcons';
import type { AvailableDate } from '../data/sportsData';

interface ConfirmBookingViewProps {
  sport: SportActivity;
  date: AvailableDate;
  timeSlot: string;
  currentUser?: UserType | null;
  onBack: () => void;
  onConfirm: (bookingDetails: {
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
  }) => void;
}

export const ConfirmBookingView: React.FC<ConfirmBookingViewProps> = ({
  sport,
  date,
  timeSlot,
  currentUser,
  onBack,
  onConfirm,
}) => {
  const [userName, setUserName] = useState(
    currentUser && !currentUser.isGuest ? currentUser.name : ''
  );
  const [registrationNumber, setRegistrationNumber] = useState(
    currentUser?.registrationNumber || ''
  );
  const [email, setEmail] = useState(
    currentUser && !currentUser.isGuest ? currentUser.email : ''
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Confirm Booking');



  const categoryLabel = sport.category === 'indoor' ? 'Indoor Games' : 'Turf & Grounds';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = userName.trim();
    const cleanReg = registrationNumber.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setError('Please enter your full name');
      return;
    }

    if (!cleanReg) {
      setError('Please enter your campus registration number');
      return;
    }

    if (cleanReg.length !== 8) {
      setError('Registration number must be exactly 8 characters (e.g. 22BCE104)');
      return;
    }

    if (!cleanEmail) {
      setError('Please enter your email address to receive your confirmation receipt');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setIsSubmitting(true);
    setStatusMessage('Connecting to SMTP server...');

    // Generate booking ID for the receipt email
    const prefix = sport.name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .padEnd(2, 'X');
    const parts = date.dateKey.split('-');
    const day = parts[2] || '31';
    const month = parts[1] || '08';
    const year = (parts[0] || '2026').slice(-2);
    const timeNum = timeSlot.replace(/[^0-9]/g, '').slice(0, 4) || '1200';
    const bookingId = `${prefix}${day}${month}${year}${timeNum}`;

    let emailStatus: 'sent' | 'failed' | 'simulated' = 'sent';
    let previewUrl: string | undefined = undefined;
    let emailError: string | undefined = undefined;
    let emailSender: string | undefined = undefined;

    try {
      setStatusMessage('Sending confirmation receipt via SMTP...');
      const response = await fetch('/api/send-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          userName: cleanName,
          registrationNumber: cleanReg.toUpperCase(),
          userEmail: cleanEmail,
          activityName: sport.name,
          dateString: date.fullDateString,
          timeSlot,
          venue: sport.defaultVenue,
        }),
      });

      let result: any = null;
      try {
        result = await response.json();
      } catch {
        result = { success: false, error: 'Failed to parse SMTP server response' };
      }

      if (result && result.success) {
        emailStatus = result.mode === 'smtp_ethereal' ? 'simulated' : 'sent';
        if (result.previewUrl) {
          previewUrl = result.previewUrl;
        }
        if (result.sender) {
          emailSender = result.sender;
        }
      } else {
        emailStatus = 'failed';
        emailError = result?.error || 'SMTP delivery failed';
        console.warn('SMTP delivery issue:', emailError);
      }
    } catch (err: any) {
      console.warn('Could not contact SMTP server endpoint:', err);
      emailStatus = 'failed';
      emailError = err?.message || 'Network error communicating with SMTP service';
    }

    onConfirm({
      sport,
      dateString: date.fullDateString,
      dateKey: date.dateKey,
      timeSlot,
      venue: sport.defaultVenue,
      userName: cleanName,
      registrationNumber: cleanReg.toUpperCase(),
      userEmail: cleanEmail,
      userId: currentUser?.id,
      emailDeliveryStatus: emailStatus,
      emailPreviewUrl: previewUrl,
      emailError,
      emailSender,
    });
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-16">
      {/* Breadcrumb matching Screen 5 */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>{categoryLabel}</span>
        </button>
        <span className="text-slate-300">/</span>
        <button
          onClick={onBack}
          className="hover:text-blue-600 transition-colors cursor-pointer"
        >
          {sport.name}
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold">Confirm Booking</span>
      </nav>

      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Confirm Your Booking
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Please enter your student details to confirm and receive your SMTP email receipt
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Booking Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Booking Summary
          </h2>

          <div className="space-y-3.5 divide-y divide-slate-100">
            {/* Game / Sport */}
            <div className="flex items-center gap-3.5 pt-1">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                <SportIconRenderer iconName={sport.iconName} size={22} className="text-blue-600" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Game
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {sport.name}
                </span>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3.5 pt-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Date
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {date.fullDateString}
                </span>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3.5 pt-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Time
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {timeSlot}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Student Details Section */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Student Information
          </h2>

          {/* Student Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Your Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={userName}
                onChange={e => {
                  setUserName(e.target.value);
                  setError('');
                }}
                placeholder="e.g Jeffy Joe"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all"
              />
            </div>
          </div>

          {/* Campus Registration Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Campus Registration / Roll Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                maxLength={8}
                value={registrationNumber}
                onChange={e => {
                  setRegistrationNumber(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="e.g. 22BCE104"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase font-mono text-slate-900 placeholder-slate-400 placeholder:normal-case focus:outline-hidden focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all"
              />
            </div>
          </div>

          {/* Enter Your Email section */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Email Address (for Booking Receipt)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="e.g. yourname@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Your official PDF/HTML entry receipt will be dispatched to this email via SMTP.
            </p>
          </div>

          {error && (
            <p className="text-xs text-rose-500 font-semibold bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              {error}
            </p>
          )}

          {/* Privacy & Security Note matching Screen 5 */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 text-xs">
            <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>
              Your registration number and email are used exclusively for campus facility booking verification.
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{statusMessage}</span>
            </>
          ) : (
            <>
              <span>Confirm Booking & Send Receipt</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
