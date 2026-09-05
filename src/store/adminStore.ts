import { useState, useEffect } from 'react';
import type { SlotRestriction, Announcement, ActivityCategory } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const RESTRICTIONS_STORAGE_KEY = 'campus_sports_restrictions_v2';
const ANNOUNCEMENTS_STORAGE_KEY = 'campus_sports_announcements_v2';

export const INITIAL_RESTRICTIONS: SlotRestriction[] = [];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

function mapSupabaseRowToRestriction(row: any): SlotRestriction {
  return {
    id: row.id,
    facilityCategory: row.facility_category,
    facilityName: row.facility_name,
    activityId: row.activity_id || undefined,
    activityName: row.activity_name || undefined,
    type: row.type || 'slot',
    dateKey: row.date_key,
    dateString: row.date_string,
    timeSlot: row.time_slot,
    reason: row.reason,
    description: row.description || undefined,
    createdAt: row.created_at,
  };
}

function mapSupabaseRowToAnnouncement(row: any): Announcement {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    priority: row.priority || 'High',
    publishDate: row.publish_date,
    isActive: row.is_active !== false,
    createdAt: row.created_at,
  };
}

function loadRestrictions(): SlotRestriction[] {
  try {
    // Purge legacy storage with static mock restrictions
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
    // Remove old legacy v1 key with mock static announcements
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
}

if (typeof window !== 'undefined') {
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

  // Sync with Supabase on mount & real-time updates
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let isMounted = true;

    // Fetch live restrictions
    supabase
      .from('slot_restrictions')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }: any) => {
        if (!error && data && isMounted) {
          const mapped = data.map(mapSupabaseRowToRestriction);
          persistRestrictions(mapped);
        }
      });

    // Fetch live announcements
    supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }: any) => {
        if (!error && data && isMounted) {
          const mapped = data.map(mapSupabaseRowToAnnouncement);
          persistAnnouncements(mapped);
        }
      });

    // Subscriptions
    const channel = supabase
      .channel('public:admin_store')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slot_restrictions' }, (payload: any) => {
        if (!isMounted) return;
        if (payload.eventType === 'INSERT') {
          const newR = mapSupabaseRowToRestriction(payload.new);
          persistRestrictions([newR, ...globalRestrictions.filter(r => r.id !== newR.id)]);
        } else if (payload.eventType === 'UPDATE') {
          const updated = mapSupabaseRowToRestriction(payload.new);
          persistRestrictions(globalRestrictions.map(r => r.id === updated.id ? updated : r));
        } else if (payload.eventType === 'DELETE') {
          persistRestrictions(globalRestrictions.filter(r => r.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, (payload: any) => {
        if (!isMounted) return;
        if (payload.eventType === 'INSERT') {
          const newA = mapSupabaseRowToAnnouncement(payload.new);
          persistAnnouncements([newA, ...globalAnnouncements.filter(a => a.id !== newA.id)]);
        } else if (payload.eventType === 'UPDATE') {
          const updated = mapSupabaseRowToAnnouncement(payload.new);
          persistAnnouncements(globalAnnouncements.map(a => a.id === updated.id ? updated : a));
        } else if (payload.eventType === 'DELETE') {
          persistAnnouncements(globalAnnouncements.filter(a => a.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const persistRestrictions = (newRestrictions: SlotRestriction[]) => {
    globalRestrictions = newRestrictions;
    try {
      localStorage.setItem(RESTRICTIONS_STORAGE_KEY, JSON.stringify(newRestrictions));
    } catch (e) {
      console.error('Failed to save restrictions', e);
    }
    notify();
  };

  const persistAnnouncements = (newAnnouncements: Announcement[]) => {
    globalAnnouncements = newAnnouncements;
    try {
      localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(newAnnouncements));
    } catch (e) {
      console.error('Failed to save announcements', e);
    }
    notify();
  };

  const addRestriction = (params: Omit<SlotRestriction, 'id' | 'createdAt'>): SlotRestriction => {
    const newRestriction: SlotRestriction = {
      ...params,
      id: 'rst-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString(),
    };
    persistRestrictions([newRestriction, ...globalRestrictions]);

    if (isSupabaseConfigured) {
      supabase.from('slot_restrictions').insert({
        id: newRestriction.id,
        facility_category: newRestriction.facilityCategory,
        facility_name: newRestriction.facilityName,
        activity_id: newRestriction.activityId || null,
        activity_name: newRestriction.activityName || null,
        type: newRestriction.type,
        date_key: newRestriction.dateKey,
        date_string: newRestriction.dateString,
        time_slot: newRestriction.timeSlot,
        reason: newRestriction.reason,
        description: newRestriction.description || null,
        created_at: newRestriction.createdAt,
      }).then(({ error }: any) => {
        if (error) console.error('Supabase addRestriction error:', error);
      });
    }

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
    persistRestrictions([...newRestrictions, ...globalRestrictions]);

    if (isSupabaseConfigured) {
      const rows = newRestrictions.map(r => ({
        id: r.id,
        facility_category: r.facilityCategory,
        facility_name: r.facilityName,
        activity_id: r.activityId || null,
        activity_name: r.activityName || null,
        type: r.type,
        date_key: r.dateKey,
        date_string: r.dateString,
        time_slot: r.timeSlot,
        reason: r.reason,
        description: r.description || null,
        created_at: r.createdAt,
      }));
      supabase.from('slot_restrictions').insert(rows).then(({ error }: any) => {
        if (error) console.error('Supabase addRestrictions error:', error);
      });
    }

    return newRestrictions;
  };

  const removeRestriction = (id: string) => {
    persistRestrictions(globalRestrictions.filter(r => r.id !== id));
    if (isSupabaseConfigured) {
      supabase.from('slot_restrictions').delete().eq('id', id).then(({ error }: any) => {
        if (error) console.error('Supabase removeRestriction error:', error);
      });
    }
  };

  const updateRestriction = (id: string, updates: Partial<SlotRestriction>) => {
    persistRestrictions(
      globalRestrictions.map(r => (r.id === id ? { ...r, ...updates } : r))
    );
    if (isSupabaseConfigured) {
      const dbUpdates: any = {};
      if (updates.facilityCategory) dbUpdates.facility_category = updates.facilityCategory;
      if (updates.facilityName) dbUpdates.facility_name = updates.facilityName;
      if (updates.activityId !== undefined) dbUpdates.activity_id = updates.activityId;
      if (updates.activityName !== undefined) dbUpdates.activity_name = updates.activityName;
      if (updates.type) dbUpdates.type = updates.type;
      if (updates.dateKey) dbUpdates.date_key = updates.dateKey;
      if (updates.dateString) dbUpdates.date_string = updates.dateString;
      if (updates.timeSlot) dbUpdates.time_slot = updates.timeSlot;
      if (updates.reason) dbUpdates.reason = updates.reason;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      supabase.from('slot_restrictions').update(dbUpdates).eq('id', id).then(({ error }: any) => {
        if (error) console.error('Supabase updateRestriction error:', error);
      });
    }
  };

  const addAnnouncement = (params: Omit<Announcement, 'id' | 'createdAt'>): Announcement => {
    const newAnnouncement: Announcement = {
      ...params,
      id: 'ann-' + Date.now().toString(36),
      createdAt: new Date().toISOString(),
    };
    persistAnnouncements([newAnnouncement, ...globalAnnouncements]);

    if (isSupabaseConfigured) {
      supabase.from('announcements').insert({
        id: newAnnouncement.id,
        title: newAnnouncement.title,
        message: newAnnouncement.message,
        priority: newAnnouncement.priority,
        publish_date: newAnnouncement.publishDate,
        is_active: newAnnouncement.isActive,
        created_at: newAnnouncement.createdAt,
      }).then(({ error }: any) => {
        if (error) console.error('Supabase addAnnouncement error:', error);
      });
    }

    return newAnnouncement;
  };

  const removeAnnouncement = (id: string) => {
    persistAnnouncements(globalAnnouncements.filter(a => a.id !== id));
    if (isSupabaseConfigured) {
      supabase.from('announcements').delete().eq('id', id).then(({ error }: any) => {
        if (error) console.error('Supabase removeAnnouncement error:', error);
      });
    }
  };

  const updateAnnouncement = (id: string, updates: Partial<Announcement>) => {
    persistAnnouncements(
      globalAnnouncements.map(a => (a.id === id ? { ...a, ...updates } : a))
    );
    if (isSupabaseConfigured) {
      const dbUpdates: any = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.message) dbUpdates.message = updates.message;
      if (updates.priority) dbUpdates.priority = updates.priority;
      if (updates.publishDate) dbUpdates.publish_date = updates.publishDate;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      supabase.from('announcements').update(dbUpdates).eq('id', id).then(({ error }: any) => {
        if (error) console.error('Supabase updateAnnouncement error:', error);
      });
    }
  };

  const toggleAnnouncementActive = (id: string) => {
    const target = globalAnnouncements.find(a => a.id === id);
    const newStatus = target ? !target.isActive : true;
    persistAnnouncements(
      globalAnnouncements.map(a => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
    if (isSupabaseConfigured) {
      supabase.from('announcements').update({ is_active: newStatus }).eq('id', id).then(({ error }: any) => {
        if (error) console.error('Supabase toggleAnnouncementActive error:', error);
      });
    }
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

      // If this restriction targets a specific sport/game, only apply to that game
      if (r.activityId && r.activityId !== 'all') {
        if (!activityId || r.activityId !== activityId) {
          continue;
        }
      }

      if (r.dateKey === dateKey) {
        if (r.type === 'date' || r.timeSlot === 'All Day') {
          return { isRestricted: true, reason: r.reason, description: r.description };
        }

        // If checking whole day availability, an individual slot restriction does not make the whole day restricted
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

  // Interval overlap: slot overlaps with range if slotStart < rangeEnd and slotEnd > rangeStart
  return slotStart < rangeEnd && slotEnd > rangeStart;
}
