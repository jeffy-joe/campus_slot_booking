import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  ArrowLeft,
  Info,
  CreditCard,
  X,
  Loader2,
  KeyRound,
  RotateCcw,
} from 'lucide-react';
import { LogoIcon } from '../components/SportIcons';
import { AuthIllustration } from '../components/AuthIllustration';
import { useAuthStore } from '../store/authStore';
import type { User as UserData } from '../types';

const VERIFY_EMAIL_STORAGE_KEY = 'campus_sports_verify_email_v2';
const AUTH_MODE_STORAGE_KEY = 'campus_sports_auth_mode_v2';

interface AuthViewProps {
  initialMode?: 'login' | 'signup' | 'verify';
  onAuthSuccess: (user?: UserData) => void;
  onContinueGuest?: () => void;
  onNavigateMode?: (mode: 'login' | 'signup' | 'verify') => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = 'login',
  onAuthSuccess,
  onContinueGuest,
  onNavigateMode,
}) => {
  const {
    login,
    initiateSignup,
    verifySignup,
    resendVerificationCode,
    continueAsGuest,
    requestPasswordReset,
    rememberMe,
    setRememberMe,
  } = useAuthStore();

  const mode = initialMode;

  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginPendingVerify, setLoginPendingVerify] = useState(false);

  // Signup form states
  const [signupName, setSignupName] = useState('');
  const [signupRegNo, setSignupRegNo] = useState('');
  const [signupEmail, setSignupEmail] = useState(() => {
    try {
      return localStorage.getItem(VERIFY_EMAIL_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  // Verification form states
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Modals
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // Persist mode & notify parent
  const switchMode = (newMode: 'login' | 'signup' | 'verify') => {
    try {
      localStorage.setItem(AUTH_MODE_STORAGE_KEY, newMode);
    } catch (e) {
      console.error(e);
    }
    if (onNavigateMode) {
      onNavigateMode(newMode);
    }
  };

  // Sync signupEmail to storage for refresh preservation
  useEffect(() => {
    if (signupEmail) {
      try {
        localStorage.setItem(VERIFY_EMAIL_STORAGE_KEY, signupEmail);
      } catch (e) {
        console.error(e);
      }
    }
  }, [signupEmail]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (showGuestModal || showForgotModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showGuestModal, showForgotModal]);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginPendingVerify(false);
    setLoginLoading(true);

    try {
      const res = await login(loginEmail, loginPassword, rememberMe);
      if (res.success) {
        onAuthSuccess(res.user);
      } else {
        setLoginError(res.error || 'Login failed. Please verify credentials.');
        if (res.requiresVerification) {
          setLoginPendingVerify(true);
        }
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Signup Submit (Live 6-digit code via SMTP)
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupLoading(true);

    try {
      const res = await initiateSignup(
        signupName,
        signupRegNo,
        signupEmail,
        signupPassword
      );

      if (res.success) {
        setVerificationCode('');
        setVerifyError('');
        setResendCooldown(45);
        switchMode('verify');
      } else {
        setSignupError(res.error || 'Sign up failed.');
      }
    } catch (err: any) {
      setSignupError(err?.message || 'Error initiating sign up.');
    } finally {
      setSignupLoading(false);
    }
  };

  // Handle Verification Submit
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError('');
    setVerifyLoading(true);

    try {
      const targetEmail = signupEmail || loginEmail;
      const res = await verifySignup(targetEmail, verificationCode);
      if (res.success) {
        onAuthSuccess(res.user);
      } else {
        setVerifyError(res.error || 'Verification failed. Please check the code.');
      }
    } finally {
      setVerifyLoading(false);
    }
  };

  // Handle Resend Verification Code
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setVerifyError('');
    const targetEmail = signupEmail || loginEmail;

    const res = await resendVerificationCode(targetEmail);
    if (res.success) {
      setResendCooldown(45);
    } else {
      setVerifyError(res.error || 'Failed to resend verification code.');
    }
  };

  // Handle Guest Confirmation
  const handleConfirmGuest = () => {
    continueAsGuest();
    setShowGuestModal(false);
    if (onContinueGuest) {
      onContinueGuest();
    } else {
      onAuthSuccess();
    }
  };

  // Handle Forgot Password
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await requestPasswordReset(forgotEmail);
      if (res.success) {
        setForgotStatus({
          success: true,
          message: res.message || 'Password reset instructions sent to your email.',
        });
      } else {
        setForgotStatus({
          success: false,
          message: res.error || 'Failed to process password reset.',
        });
      }
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-center py-6 sm:py-10 px-3 sm:px-6 lg:px-8 relative selection:bg-blue-100">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-sky-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Responsive Container */}
      <div className="max-w-6xl w-full mx-auto">
        {mode === 'login' && (
          /* =========================================================
             LOGIN VIEW (Fully Responsive for Mobile & Desktop)
             ========================================================= */
          <div className="bg-transparent rounded-3xl p-0 sm:p-2 md:p-0">
            {/* Mobile Header (Visible only on < lg screens for immediate brand presence) */}
            <div className="lg:hidden flex flex-col items-center text-center mb-6 space-y-2">
              <div className="flex items-center gap-2.5">
                <LogoIcon className="w-9 h-9 drop-shadow-sm flex-shrink-0" />
                <div className="leading-tight text-left">
                  <span className="block font-black text-slate-900 text-lg tracking-tight">
                    Book<span className="text-blue-600">Myslot</span>
                  </span>
                </div>
              </div>
              <p className="text-slate-500 text-xs max-w-xs">
                Book indoor games and outdoor grounds easily without hassle.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Brand, Illustration & Features (Desktop layout) */}
              <div className="hidden lg:block lg:col-span-6 space-y-7 xl:pr-6">
                {/* Brand Logo Header */}
                <div className="flex items-center gap-3">
                  <LogoIcon className="w-10 h-10 drop-shadow-sm flex-shrink-0" />
                  <div className="leading-tight">
                    <span className="block font-black text-slate-900 text-xl tracking-tight">
                      Book<span className="text-blue-600">Myslot</span>
                    </span>
                  </div>
                </div>

                {/* Main Heading & Subtitle */}
                <div className="space-y-2.5">
                  <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    Welcome to <br />
                    Book<span className="text-blue-600">Myslot</span>
                  </h1>
                  <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-md">
                    Book indoor games and outdoor grounds easily and play without hassle.
                  </p>
                </div>

                {/* Hero Illustration */}
                <div className="py-4 flex justify-start">
                  <AuthIllustration className="w-full max-w-[360px] sm:max-w-[420px]" />
                </div>
              </div>

              {/* Right Column: Login Card (Prominent & immediately accessible on both mobile and desktop) */}
              <div className="lg:col-span-6 flex justify-center lg:justify-end w-full">
                <div className="w-full max-w-[440px] bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-5 sm:p-8 md:p-9 relative">
                  {/* Card Title & Subtitle */}
                  <div className="text-center space-y-1.5 mb-6 sm:mb-7">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      Login to Continue
                    </h2>
                    <p className="text-slate-500 text-xs sm:text-sm">
                      Access your account to book sports slots
                    </p>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {/* Email ID Field */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Email ID
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={loginEmail}
                          onChange={e => {
                            setLoginEmail(e.target.value);
                            setLoginError('');
                          }}
                          placeholder="Enter your email id"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all min-h-[44px]"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotModal(true);
                            setForgotEmail(loginEmail);
                            setForgotStatus(null);
                          }}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer py-1"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          required
                          value={loginPassword}
                          onChange={e => {
                            setLoginPassword(e.target.value);
                            setLoginError('');
                          }}
                          placeholder="Enter your password"
                          className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all min-h-[44px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer min-h-[44px] min-w-[36px] justify-center"
                          aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                        >
                          {showLoginPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Remember me Checkbox */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        id="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <label
                        htmlFor="remember-me"
                        className="text-xs text-slate-600 select-none cursor-pointer font-medium"
                      >
                        Remember me
                      </label>
                    </div>

                    {/* Error message */}
                    {loginError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium space-y-2">
                        <div>{loginError}</div>
                        {loginPendingVerify && (
                          <button
                            type="button"
                            onClick={() => {
                              setSignupEmail(loginEmail);
                              switchMode('verify');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            <span>Enter Verification Code</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Login Submit Button */}
                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:translate-x-0.5 disabled:opacity-75 min-h-[44px]"
                    >
                      {loginLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Logging in...</span>
                        </>
                      ) : (
                        <>
                          <span>Login</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Divider: "or" */}
                    <div className="relative flex items-center justify-center py-1.5">
                      <div className="w-full border-t border-slate-200" />
                      <span className="absolute bg-white px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">
                        or
                      </span>
                    </div>

                    {/* Continue as Guest Button */}
                    <button
                      type="button"
                      onClick={() => setShowGuestModal(true)}
                      className="w-full py-3 px-4 bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 text-slate-800 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer group min-h-[44px]"
                    >
                      <User className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                      <span className="flex-1 text-center">Continue as Guest</span>
                      <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Footer: Don't have an account? Sign up here */}
                    <div className="pt-2 text-center text-xs sm:text-sm text-slate-600">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          switchMode('signup');
                          setLoginError('');
                        }}
                        className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer py-1"
                      >
                        Sign up here
                      </button>
                    </div>
                  </form>
                </div>
              </div>


            </div>
          </div>
        )}

        {mode === 'signup' && (
          /* =========================================================
             SIGN UP VIEW (Responsive for Mobile & Desktop)
             ========================================================= */
          <div className="w-full max-w-[480px] mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-5 sm:p-8 md:p-9 relative">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between pb-5 sm:pb-6 mb-5 sm:mb-6 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <LogoIcon className="w-8 h-8 flex-shrink-0" />
                <div className="leading-tight">
                  <span className="block font-black text-slate-900 text-base tracking-tight">
                    Book<span className="text-blue-600">Myslot</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  switchMode('login');
                  setSignupError('');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer py-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </button>
            </div>

            {/* Header: Title & Subtitle */}
            <div className="text-center space-y-1.5 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Create Your Account
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm">
                Join BookMyslot to book your favorite slots
              </p>
            </div>

            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={e => {
                      setSignupName(e.target.value);
                      setSignupError('');
                    }}
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all min-h-[44px]"
                  />
                </div>
              </div>

              {/* Register Number Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Register Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={signupRegNo}
                    onChange={e => {
                      setSignupRegNo(e.target.value.toUpperCase());
                      setSignupError('');
                    }}
                    placeholder="Enter 8-digit register number"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-sm uppercase font-mono text-slate-900 placeholder-slate-400 placeholder:normal-case focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all min-h-[44px]"
                  />
                </div>
              </div>

              {/* Email ID Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Email ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={e => {
                      setSignupEmail(e.target.value);
                      setSignupError('');
                    }}
                    placeholder="Enter your email id"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all min-h-[44px]"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  A 6-digit verification code will be dispatched to this email.
                </p>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={signupPassword}
                    onChange={e => {
                      setSignupPassword(e.target.value);
                      setSignupError('');
                    }}
                    placeholder="Create a password"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer min-h-[44px] min-w-[36px] justify-center"
                    aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignupPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Info banner */}
              <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-xl text-blue-700 text-xs flex items-center gap-2.5">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Use at least 6 characters for a stronger password.</span>
              </div>

              {/* Error display */}
              {signupError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {signupError}
                </div>
              )}

              {/* Sign Up Submit Button */}
              <button
                type="submit"
                disabled={signupLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:translate-x-0.5 disabled:opacity-75 min-h-[44px]"
              >
                {signupLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Verification Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Footer: Already have an account? Login here */}
              <div className="pt-2 text-center text-xs sm:text-sm text-slate-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    switchMode('login');
                    setSignupError('');
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer py-1"
                >
                  Login here
                </button>
              </div>
            </form>
          </div>
        )}

        {mode === 'verify' && (
          /* =========================================================
             EMAIL VERIFICATION VIEW (Responsive for Mobile & Desktop)
             ========================================================= */
          <div className="w-full max-w-[480px] mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-5 sm:p-8 md:p-9 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Top Navigation */}
            <div className="flex items-center justify-between pb-5 sm:pb-6 mb-5 sm:mb-6 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <LogoIcon className="w-8 h-8 flex-shrink-0" />
                <div className="leading-tight">
                  <span className="block font-black text-slate-900 text-base tracking-tight">
                    Book<span className="text-blue-600">Myslot</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  switchMode('signup');
                  setVerifyError('');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer py-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Email</span>
              </button>
            </div>

            {/* Verification Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto shadow-xs">
                <KeyRound className="w-6 sm:w-7 h-6 sm:h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Verify Your Email
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto px-2">
                We sent a 6-digit verification code to <br />
                <strong className="text-slate-800 font-semibold break-all">
                  {signupEmail || loginEmail}
                </strong>
              </p>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-5">
              {/* 6-Digit Code Input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 text-center">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={verificationCode}
                  onChange={e => {
                    setVerificationCode(e.target.value.replace(/[^0-9]/g, ''));
                    setVerifyError('');
                  }}
                  placeholder="------"
                  className="w-full text-center tracking-[8px] sm:tracking-[14px] font-mono text-xl sm:text-2xl py-3 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 focus:outline-hidden focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all min-h-[48px]"
                />
                <p className="text-[11px] text-center text-slate-400">
                  Code expires in 10 minutes.
                </p>
              </div>

              {/* Error display */}
              {verifyError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
                  {verifyError}
                </div>
              )}

              {/* Verify & Activate Button */}
              <button
                type="submit"
                disabled={verifyLoading || verificationCode.length !== 6}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:translate-x-0.5 disabled:opacity-50 disabled:hover:translate-x-0 min-h-[44px]"
              >
                {verifyLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify &amp; Log In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend Code Section */}
              <div className="pt-2 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
                <span>Didn't receive the email?</span>
                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={handleResendCode}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer inline-flex items-center gap-1 py-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : 'Resend Code'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* =========================================================
         CONTINUE AS GUEST MODAL (Responsive for Mobile & Desktop)
         ========================================================= */}
      {showGuestModal &&
        (typeof document !== 'undefined'
          ? createPortal(
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
                {/* Full-screen Backdrop with complete viewport coverage */}
                <div
                  className="fixed inset-0 w-full h-full min-h-screen min-h-[100dvh] bg-slate-900/60 backdrop-blur-xs pointer-events-auto transition-opacity duration-200"
                  onClick={() => setShowGuestModal(false)}
                  aria-hidden="true"
                />

                <div
                  role="dialog"
                  aria-modal="true"
                  className="relative bg-white rounded-t-[28px] sm:rounded-3xl max-w-full sm:max-w-md w-full p-5 sm:p-7 shadow-2xl border-t sm:border border-slate-100 pointer-events-auto space-y-4 sm:space-y-5 pb-8 sm:pb-7 z-10 animate-in"
                  style={{ animation: 'modalSlideUp 0.22s ease-out' }}
                >
                  {/* Mobile Pull Handle */}
                  <div className="w-12 h-1.5 bg-slate-300/80 rounded-full mx-auto -mt-1 mb-2 sm:hidden" />

                  {/* Top Close Button */}
                  <button
                    type="button"
                    onClick={() => setShowGuestModal(false)}
                    className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Close dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Header with Avatar and Title */}
                  <div className="flex items-start gap-3.5 pr-6">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                      <User className="w-5 sm:w-6 h-5 sm:h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                        Continue as Guest?
                      </h3>
                      <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                        You can book slots without creating an account.
                      </p>
                    </div>
                  </div>

                  {/* Info callout */}
                  <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-xl text-blue-800 text-xs flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Booking confirmation will be sent to your email address.</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowGuestModal(false)}
                      className="px-4 sm:px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer min-h-[42px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmGuest}
                      className="px-5 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/25 transition-colors cursor-pointer min-h-[42px]"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )
          : null)}

      {/* =========================================================
         FORGOT PASSWORD MODAL (Responsive for Mobile & Desktop)
         ========================================================= */}
      {showForgotModal &&
        (typeof document !== 'undefined'
          ? createPortal(
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
                {/* Full-screen Backdrop with complete viewport coverage */}
                <div
                  className="fixed inset-0 w-full h-full min-h-screen min-h-[100dvh] bg-slate-900/60 backdrop-blur-xs pointer-events-auto transition-opacity duration-200"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotStatus(null);
                  }}
                  aria-hidden="true"
                />

                <div
                  role="dialog"
                  aria-modal="true"
                  className="relative bg-white rounded-t-[28px] sm:rounded-3xl max-w-full sm:max-w-md w-full p-5 sm:p-7 shadow-2xl border-t sm:border border-slate-100 pointer-events-auto space-y-4 sm:space-y-5 pb-8 sm:pb-7 z-10 animate-in"
                  style={{ animation: 'modalSlideUp 0.22s ease-out' }}
                >
                  {/* Mobile Pull Handle */}
                  <div className="w-12 h-1.5 bg-slate-300/80 rounded-full mx-auto -mt-1 mb-2 sm:hidden" />

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotStatus(null);
                    }}
                    className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Close dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                      Reset Password
                    </h3>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                      Enter your campus email to receive a password reset verification code.
                    </p>
                  </div>

                  {forgotStatus ? (
                    <div className="space-y-4">
                      <div
                        className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                          forgotStatus.success
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}
                      >
                        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>{forgotStatus.message}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotModal(false);
                          setForgotStatus(null);
                        }}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer min-h-[44px]"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Email ID
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="email"
                            required
                            value={forgotEmail}
                            onChange={e => setForgotEmail(e.target.value)}
                            placeholder="Enter your campus email"
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all min-h-[44px]"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowForgotModal(false)}
                          className="px-4 sm:px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer min-h-[42px]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={forgotLoading}
                          className="px-5 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/25 transition-colors cursor-pointer disabled:opacity-75 flex items-center gap-1.5 min-h-[42px]"
                        >
                          {forgotLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>Send Code</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>,
              document.body
            )
          : null)}
      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
