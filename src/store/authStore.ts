import { useSyncExternalStore } from 'react';
import type { User } from '../types';
import {
  fetchUsersFromDB,
  saveUserToDB,
  savePendingVerificationToDB,
  deletePendingVerificationFromDB,
} from '../services/dbService';

export interface StoredAccount extends User {
  passwordHash: string;
  isVerified: boolean;
  createdAt: string;
}

export interface PendingVerification {
  name: string;
  registrationNumber: string;
  email: string;
  passwordHash: string;
  code: string;
  expiresAt: number;
  sentAt: number;
}

const USERS_STORAGE_KEY = 'campus_sports_users_v2';
const PENDING_STORAGE_KEY = 'campus_sports_pending_verifications_v2';
const CURRENT_USER_KEY = 'campus_sports_current_user_v2';
const REMEMBER_ME_KEY = 'campus_sports_remember_me_v2';

export const ADMIN_EMAIL = 'admin@campus.com';
export const ADMIN_PASSWORD = 'admin@987';

export const ADMIN_USER: User = {
  id: 'admin-001',
  name: 'Admin',
  email: 'admin@campus.com',
  isAdmin: true,
  isVerified: true,
  isGuest: false,
};

// Clean slate: NO MOCK DATA. Real accounts only.
function loadUsers(): StoredAccount[] {
  try {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      const parsed: StoredAccount[] = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Filter out any legacy mock accounts
        return parsed.filter(
          u =>
            u.email !== 'rahul.campus@gmail.com' &&
            u.email !== 'alex.campus@gmail.com' &&
            u.passwordHash !== 'password123' &&
            u.isVerified === true
        );
      }
    }
  } catch (e) {
    console.error('Failed to parse saved users', e);
  }
  return [];
}

function loadPendingVerifications(): Record<string, PendingVerification> {
  try {
    const saved = localStorage.getItem(PENDING_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse pending verifications', e);
  }
  return {};
}

function loadCurrentUser(): User | null {
  try {
    const saved = localStorage.getItem(CURRENT_USER_KEY);
    if (saved) {
      const user = JSON.parse(saved);
      // Ensure only real verified users or guest are persisted
      if (
        user &&
        user.email !== 'rahul.campus@gmail.com' &&
        user.email !== 'alex.campus@gmail.com'
      ) {
        return user;
      }
    }
  } catch (e) {
    console.error('Failed to parse current user', e);
  }
  return null;
}

function loadRememberMe(): boolean {
  try {
    return localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
  } catch {
    return true;
  }
}

interface AuthState {
  users: StoredAccount[];
  pendingVerifications: Record<string, PendingVerification>;
  currentUser: User | null;
  rememberMe: boolean;
}

// Global Singleton Store State
let globalState: AuthState = {
  users: loadUsers(),
  pendingVerifications: loadPendingVerifications(),
  currentUser: loadCurrentUser(),
  rememberMe: loadRememberMe(),
};

// Sync users from Supabase on init if configured
fetchUsersFromDB().then(dbUsers => {
  if (dbUsers && Array.isArray(dbUsers)) {
    setGlobalState(prev => ({
      ...prev,
      users: dbUsers,
    }));
  }
});

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(listener => listener());
}

function setGlobalState(updater: (prev: AuthState) => AuthState) {
  globalState = updater(globalState);

  // Synchronously persist
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(globalState.users));
    localStorage.setItem(
      PENDING_STORAGE_KEY,
      JSON.stringify(globalState.pendingVerifications)
    );
    if (globalState.currentUser) {
      localStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify(globalState.currentUser)
      );
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
    localStorage.setItem(REMEMBER_ME_KEY, String(globalState.rememberMe));
  } catch (e) {
    console.error('Storage sync error:', e);
  }

  notifyListeners();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): AuthState {
  return globalState;
}

export function useAuthStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // 1. Real-time Login (Only verified accounts)
  const login = async (
    email: string,
    password: string,
    remember: boolean = true
  ): Promise<{ success: boolean; error?: string; user?: User; requiresVerification?: boolean }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email ID.' };
    }
    if (!cleanPassword) {
      return { success: false, error: 'Please enter your password.' };
    }

    // Check specific Admin credentials: admin@campus.com / admin@987
    if (cleanEmail === ADMIN_EMAIL) {
      if (cleanPassword === ADMIN_PASSWORD) {
        setGlobalState(prev => ({
          ...prev,
          rememberMe: remember,
          currentUser: ADMIN_USER,
        }));
        return { success: true, user: ADMIN_USER };
      } else {
        return {
          success: false,
          error: 'Incorrect admin password. Please try again.',
        };
      }
    }

    let found = globalState.users.find(
      u => u.email.trim().toLowerCase() === cleanEmail
    );

    // Attempt live fetch from Supabase DB if not in local memory
    if (!found) {
      const dbUsers = await fetchUsersFromDB();
      if (dbUsers && Array.isArray(dbUsers)) {
        setGlobalState(prev => ({
          ...prev,
          users: dbUsers,
        }));
        found = dbUsers.find(u => u.email.trim().toLowerCase() === cleanEmail);
      }
    }

    if (!found) {
      // Check if there is a pending unverified registration for this email
      if (globalState.pendingVerifications[cleanEmail]) {
        return {
          success: false,
          requiresVerification: true,
          error: 'Your account is pending verification. Please enter the verification code sent to your email.',
        };
      }
      return {
        success: false,
        error: `No verified account found for "${cleanEmail}". Please create an account.`,
      };
    }

    if (found.passwordHash !== cleanPassword) {
      return {
        success: false,
        error: 'Incorrect password. Please try again or reset your password.',
      };
    }

    const authUser: User = {
      id: found.id,
      name: found.name,
      email: found.email,
      registrationNumber: found.registrationNumber,
      isGuest: false,
      isVerified: true,
    };

    setGlobalState(prev => ({
      ...prev,
      rememberMe: remember,
      currentUser: authUser,
    }));

    return { success: true, user: authUser };
  };

  // 2. Initiate Real-time Sign-up (Dispatches 6-digit verification code via SMTP)
  const initiateSignup = async (
    name: string,
    registrationNumber: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; email?: string }> => {
    const cleanName = name.trim();
    const cleanReg = registrationNumber.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanName) {
      return { success: false, error: 'Please enter your full name.' };
    }
    if (!cleanReg) {
      return { success: false, error: 'Please enter your registration number.' };
    }
    if (cleanReg.length !== 8) {
      return {
        success: false,
        error: 'Register number must be exactly 8 characters (e.g. 22BCE104).',
      };
    }
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email ID.' };
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters.',
      };
    }

    // Check if account already exists and is verified
    const existing = globalState.users.find(
      u => u.email.trim().toLowerCase() === cleanEmail
    );
    if (existing) {
      return {
        success: false,
        error: `An active account with "${cleanEmail}" already exists. Please log in.`,
      };
    }

    // Check if an account with this Register Number already exists
    const existingReg = globalState.users.find(
      u =>
        u.registrationNumber &&
        u.registrationNumber.trim().toUpperCase() === cleanReg
    );
    if (existingReg) {
      return {
        success: false,
        error: `An account with Register Number "${cleanReg}" already exists.`,
      };
    }

    // Check if a pending registration with this Register Number is already in progress
    const pendingReg = Object.values(globalState.pendingVerifications).find(
      p =>
        p.registrationNumber &&
        p.registrationNumber.trim().toUpperCase() === cleanReg &&
        p.email !== cleanEmail
    );
    if (pendingReg) {
      return {
        success: false,
        error: `An account registration for Register Number "${cleanReg}" is already pending verification.`,
      };
    }

    // Generate real 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Dispatch via real SMTP
    try {
      const response = await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          code,
          userName: cleanName,
        }),
      });

      let resData: any = {};
      try {
        const text = await response.text();
        resData = JSON.parse(text);
      } catch {
        resData = {
          success: false,
          error: `Server error (${response.status}). Please check Vercel environment variable settings.`,
        };
      }

      if (!response.ok || !resData.success) {
        return {
          success: false,
          error: resData.error || 'Failed to dispatch verification email. Please check your email address.',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Network error connecting to email verification service.',
      };
    }

    const pendingData: PendingVerification = {
      name: cleanName,
      registrationNumber: cleanReg,
      email: cleanEmail,
      passwordHash: cleanPassword,
      code,
      expiresAt,
      sentAt: Date.now(),
    };

    // Save pending verification locally and to Supabase DB
    savePendingVerificationToDB(pendingData);
    setGlobalState(prev => ({
      ...prev,
      pendingVerifications: {
        ...prev.pendingVerifications,
        [cleanEmail]: pendingData,
      },
    }));

    return { success: true, email: cleanEmail };
  };

  // 3. Verify Code and Complete Registration
  const verifySignup = async (
    email: string,
    enteredCode: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = enteredCode.trim();

    const pending = globalState.pendingVerifications[cleanEmail];
    if (!pending) {
      return {
        success: false,
        error: 'No pending registration found for this email. Please sign up again.',
      };
    }

    if (Date.now() > pending.expiresAt) {
      return {
        success: false,
        error: 'Verification code has expired. Please click "Resend Code".',
      };
    }

    if (pending.code !== cleanCode) {
      return {
        success: false,
        error: 'Incorrect verification code. Please check your email and try again.',
      };
    }

    // Check if an account with this Register Number was created in the meantime
    const existingReg = globalState.users.find(
      u =>
        u.registrationNumber &&
        u.registrationNumber.trim().toUpperCase() ===
          pending.registrationNumber.trim().toUpperCase()
    );
    if (existingReg) {
      return {
        success: false,
        error: `An account with Register Number "${pending.registrationNumber}" already exists.`,
      };
    }

    // Code matched! Create verified account
    const newAccount: StoredAccount = {
      id: `user_${Date.now()}`,
      name: pending.name,
      registrationNumber: pending.registrationNumber,
      email: pending.email,
      passwordHash: pending.passwordHash,
      isVerified: true,
      createdAt: new Date().toISOString(),
      isGuest: false,
    };

    const authUser: User = {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      registrationNumber: newAccount.registrationNumber,
      isGuest: false,
      isVerified: true,
    };

    // Save verified user account to Supabase DB and remove pending verification
    await saveUserToDB(newAccount);
    await deletePendingVerificationFromDB(cleanEmail);

    // Remove from pending and add to verified users
    setGlobalState(prev => {
      const nextPending = { ...prev.pendingVerifications };
      delete nextPending[cleanEmail];

      return {
        ...prev,
        pendingVerifications: nextPending,
        users: [...prev.users.filter(u => u.email.toLowerCase() !== cleanEmail), newAccount],
        currentUser: authUser,
      };
    });

    return { success: true, user: authUser };
  };

  // 4. Resend Verification Code
  const resendVerificationCode = async (
    email: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const pending = globalState.pendingVerifications[cleanEmail];

    if (!pending) {
      return {
        success: false,
        error: 'No pending registration found for this email. Please start sign up.',
      };
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    try {
      const response = await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          code: newCode,
          userName: pending.name,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        return {
          success: false,
          error: resData.error || 'Failed to resend code.',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Network error resending code.',
      };
    }

    setGlobalState(prev => ({
      ...prev,
      pendingVerifications: {
        ...prev.pendingVerifications,
        [cleanEmail]: {
          ...pending,
          code: newCode,
          expiresAt,
          sentAt: Date.now(),
        },
      },
    }));

    return {
      success: true,
      message: `A new 6-digit verification code was sent to ${cleanEmail}.`,
    };
  };

  // 5. Continue As Guest
  const continueAsGuest = (): User => {
    const guestUser: User = {
      id: `guest_${Date.now()}`,
      name: 'Guest User',
      email: '',
      registrationNumber: '',
      isGuest: true,
      isVerified: true,
    };

    setGlobalState(prev => ({
      ...prev,
      currentUser: guestUser,
    }));

    return guestUser;
  };

  const logout = () => {
    setGlobalState(prev => ({
      ...prev,
      currentUser: null,
    }));
  };

  const setRememberMe = (remember: boolean) => {
    setGlobalState(prev => ({
      ...prev,
      rememberMe: remember,
    }));
  };

  // 6. Reset Password via Verification Code
  const requestPasswordReset = async (
    email: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const found = globalState.users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      return {
        success: false,
        error: `No registered account found for ${cleanEmail}.`,
      };
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const response = await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          code: resetCode,
          userName: found.name,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        return { success: false, error: resData.error || 'Failed to dispatch reset code.' };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error communicating with SMTP service.' };
    }

    return {
      success: true,
      message: `Password reset verification code dispatched to ${cleanEmail}.`,
    };
  };

  return {
    currentUser: state.currentUser,
    users: state.users,
    pendingVerifications: state.pendingVerifications,
    rememberMe: state.rememberMe,
    setRememberMe,
    login,
    initiateSignup,
    verifySignup,
    resendVerificationCode,
    continueAsGuest,
    logout,
    requestPasswordReset,
  };
}
