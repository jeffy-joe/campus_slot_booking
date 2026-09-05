import { useState, useEffect } from 'react';
import type { SlotRestriction, Announcement, ActivityCategory } from '../types';
import {
  fetchRestrictedSlotsFromDB,
  saveRestrictedSlotToDB,
  deleteRestrictedSlotFromDB,
  fetchAnnouncementsFromDB,
  saveAnnouncementToDB,
  deleteAnnouncementFromDB,
} from '../services/dbService';

const RESTRICTIONS_STORAGE_KEY = 'campus_sports_restrictions_v2';
const ANNOUNCEMENTS_STORAGE_KEY = 'campus_sports_announcements_v2';

export const INITIAL_RESTRICTIONS: SlotRestriction[] = [];
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

function loadRestrictions(): SlotRestriction[] {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('campus_sports_restrictions_v1')) {
      localStorage.removeItem('campus_sports_restrictions_v1');
    }
    const saved = localStorage.getItem(RESTRICTIONS_STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load restrictions', e);
  }
  return [];
}

function loadAnnouncements(): Announcement[] {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('campus_sports_announcements_v1')) {
      localStorage.removeItem('campus_sports_announcements_v1');
    }
    const saved = localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load announcements', e);
  }
  return [];
}

let globalRestrictions: SlotRestriction[] = loadRestrictions();
let globalAnnouncements: Announcement[] = loadAnnouncements();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(l => l());
  try {
    localStorage.setItem(RESTRICTIONS_STORAGE_KEY, JSON.stringify(globalRestrictions));
    localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(globalAnnouncements));
  } catch (e) {
    console.error('Failed to persist admin data', e);
  }
}

const syncAdminFromDB = async () => {
  const [dbRestrictions, dbAnnouncements] = await Promise.all([
    fetchRestrictedSlotsFromDB(),
    fetchAnnouncementsFromDB(),
  ]);
  let updated = false;
  if (dbRestrictions && Array.isArray(dbRestrictions)) {
    globalRestrictions = dbRestrictions;
    updated = true;
  }
  if (dbAnnouncements && Array.isArray(dbAnnouncements)) {
    globalAnnouncements = dbAnnouncements;
    updated = true;
  }
  if (updated) {
    notify();
  }
};

if (typeof window !== 'undefined') {
  syncAdminFromDB();
  setInterval(syncAdminFromDB, 5000);

  window.addEventListener('storage', (e) => {
    if (e.key === ANNOUNCEMENTS_STORAGE_KEY) {
      globalAnnouncements = loadAnnouncements();
      notify();
    }
    if (e.key === RESTRICTIONS_STORAGE_KEY) {
      globalRestrictions = loadRestrictions();
      notify();
    }
  });
}

export function useAdminStore() {
  const [restrictions, setRestrictions] = useState<SlotRestriction[]>(globalRestrictions);
  const [announcements, setAnnouncements] = useState<Announcement[]>(globalAnnouncements);

  useEffect(() => {
    const handler = () => {
      setRestrictions(globalRestrictions);
      setAnnouncements(globalAnnouncements);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const persistRestrictions = (newRestrictions: SlotRestriction[]) => {
    globalRestrictions = newRestrictions;
    notify();
  };

  const persistAnnouncements = (newAnnouncements: Announcement[]) => {
    globalAnnouncements = newAnnouncements;
    notify();
  };

  const addRestriction = (params: Omit<SlotRestriction, 'id' | 'createdAt'>): SlotRestriction => {
    const newRestriction: SlotRestriction = {
      ...params,
      id: 'rst-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString(),
    };
    saveRestrictedSlotToDB(newRestriction);
    persistRestrictions([newRestriction, ...globalRestrictions]);
    return newRestriction;
  };

  const addRestrictions = (paramsList: Omit<SlotRestriction, 'id' | 'createdAt'>[]): SlotRestriction[] => {
    if (paramsList.length === 0) return [];
    const now = new Date().toISOString();
    const newRestrictions: SlotRestriction[] = paramsList.map((params, index) => ({
      ...params,
      id: 'rst-' + Date.now().toString(36) + '-' + index + '-' + Math.random().toString(36).slice(2, 6),
      createdAt: now,
    }));
    newRestrictions.forEach(r => saveRestrictedSlotToDB(r));
    persistRestrictions([...newRestrictions, ...globalRestrictions]);
    return newRestrictions;
  };

  const removeRestriction = (id: string) => {
    deleteRestrictedSlotFromDB(id);
    persistRestrictions(globalRestrictions.filter(r => r.id !== id));
  };

  const updateRestriction = (id: string, updates: Partial<SlotRestriction>) => {
    const target = globalRestrictions.find(r => r.id === id);
    if (target) {
      const updated = { ...target, ...updates };
      saveRestrictedSlotToDB(updated);
    }
    persistRestrictions(
      globalRestrictions.map(r => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const addAnnouncement = (params: Omit<Announcement, 'id' | 'createdAt'>): Announcement => {
    const newAnnouncement: Announcement = {
      ...params,
      id: 'ann-' + Date.now().toString(36),
      createdAt: new Date().toISOString(),
    };
    saveAnnouncementToDB(newAnnouncement);
    persistAnnouncements([newAnnouncement, ...globalAnnouncements]);
    return newAnnouncement;
  };

  const removeAnnouncement = (id: string) => {
    deleteAnnouncementFromDB(id);
    persistAnnouncements(globalAnnouncements.filter(a => a.id !== id));
  };

  const updateAnnouncement = (id: string, updates: Partial<Announcement>) => {
    const target = globalAnnouncements.find(a => a.id === id);
    if (target) {
      const updated = { ...target, ...updates };
      saveAnnouncementToDB(updated);
    }
    persistAnnouncements(
      globalAnnouncements.map(a => (a.id === id ? { ...a, ...updates } : a))
    );
  };

  const toggleAnnouncementActive = (id: string) => {
    const target = globalAnnouncements.find(a => a.id === id);
    if (target) {
      const updated = { ...target, isActive: !target.isActive };
      saveAnnouncementToDB(updated);
    }
    const newStatus = target ? !target.isActive : true;
    persistAnnouncements(
      globalAnnouncements.map(a => (a.id === id ? { ...a, isActive: newStatus } : a))
    );
  };

  const isSlotRestricted = (
    dateKey: string,
    timeSlot: string,
    facilityCategory: ActivityCategory | 'all',
    activityId?: string
  ): { isRestricted: boolean; reason?: string; description?: string } => {
    for (const r of globalRestrictions) {
      const categoryMatch = facilityCategory === 'all' || r.facilityCategory === 'all' || r.facilityCategory === facilityCategory;
      if (!categoryMatch) continue;

      if (r.activityId && r.activityId !== 'all') {
        if (!activityId || r.activityId !== activityId) {
          continue;
        }
      }

      if (r.dateKey === dateKey) {
        if (r.type === 'date' || r.timeSlot === 'All Day') {
          return { isRestricted: true, reason: r.reason, description: r.description };
        }

        if (timeSlot === 'All Day') {
          continue;
        }

        if (r.timeSlot === timeSlot) {
          return { isRestricted: true, reason: r.reason, description: r.description };
        }

        if (isSlotInsideRange(timeSlot, r.timeSlot)) {
          return { isRestricted: true, reason: r.reason, description: r.description };
        }
      }
    }
    return { isRestricted: false };
  };

  return {
    restrictions,
    announcements,
    activeAnnouncements: announcements.filter(a => a.isActive),
    addRestriction,
    addRestrictions,
    removeRestriction,
    updateRestriction,
    addAnnouncement,
    removeAnnouncement,
    updateAnnouncement,
    toggleAnnouncementActive,
    isSlotRestricted,
  };
}

export function isSlotInsideRange(slot: string, range: string): boolean {
  if (!slot || !range || range === 'All Day' || slot === 'All Day') return false;
  const sClean = slot.replace(/\s*\([^)]*\)/g, '').trim();
  const rClean = range.replace(/\s*\([^)]*\)/g, '').trim();
  if (sClean === rClean) return true;

  const parseToMinutes = (timeStr: string): number | null => {
    if (!timeStr) return null;
    const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  const slotParts = sClean.split('-');
  const rangeParts = rClean.split('-');
  if (slotParts.length < 2 || rangeParts.length < 2) return false;

  const slotStart = parseToMinutes(slotParts[0]);
  const slotEnd = parseToMinutes(slotParts[1]);
  const rangeStart = parseToMinutes(rangeParts[0]);
  const rangeEnd = parseToMinutes(rangeParts[1]);

  if (slotStart === null || slotEnd === null || rangeStart === null || rangeEnd === null) {
    return false;
  }

  return slotStart < rangeEnd && slotEnd > rangeStart;
}
