import { planState, weekNotes, setCurrentUserId, getCurrentUserId, resetState } from './state.js';
import { SUPABASE_URL, SUPABASE_ANON } from './const.js';

const SUPABASE_READY_TIMEOUT_MS = 5000;

function isSupabaseRuntimeReady() {
  return !!(window.supabase && typeof window.supabase.createClient === 'function');
}

export function waitForSupabaseRuntime(timeoutMs = SUPABASE_READY_TIMEOUT_MS) {
  if (isSupabaseRuntimeReady()) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (isSupabaseRuntimeReady()) {
        clearInterval(timer);
        resolve();
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        clearInterval(timer);
        reject(new Error('Supabase runtime indisponivel.'));
      }
    }, 50);
  });
}

export function sb() {
  if (!isSupabaseRuntimeReady()) {
    throw new Error('Supabase runtime indisponivel.');
  }
  if (!window._supabase) {
    window._supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
  }
  return window._supabase;
}

// Get current user session
export async function getUser() {
  const { data: { session } } = await sb().auth.getSession();
  if (!session) {
    window.location.href = 'index.html?err=session';
    return null;
  }
  return session.user;
}

// Load all progress & notes for the current user
export async function dbLoad(uid) {
  if (uid) setCurrentUserId(uid);
  const id = getCurrentUserId();
  if (!id) return false;

  try {
    // 1. Load Progress
    const { data: progData, error: progError } = await sb()
      .from('progress')
      .select('data')
      .eq('user_id', id)
      .maybeSingle();

    if (progError) throw progError;

    if (progData && progData.data) {
      planState.completedDays = progData.data.completedDays || {};
      planState.completedComplements = progData.data.completedComplements || {};
      planState.weekCompletionHistory = progData.data.weekCompletionHistory || {};
      planState.currentWeek = progData.data.currentWeek || 32;
      planState.planStartDate = progData.data.planStartDate || null;
    }

    // 2. Load Notes
    const { data: notesData, error: notesError } = await sb()
      .from('notes')
      .select('week_number, content')
      .eq('user_id', id);

    if (notesError) throw notesError;

    // Reset notes before loading
    for (const key in weekNotes) delete weekNotes[key];
    if (notesData) {
      notesData.forEach(row => {
        weekNotes[row.week_number] = row.content;
      });
    }

    return true;
  } catch (e) {
    console.error('dbLoad error:', e);
    return false;
  }
}

// Save progress
export async function dbSave() {
  const id = getCurrentUserId();
  if (!id) return false;

  try {
    const progressData = {
      ...planState,
      planStartDate: planState.planStartDate || null
    };
    const { error } = await sb()
      .from('progress')
      .upsert(
        { user_id: id, data: progressData, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

    if (error) throw error;
    return true;
  } catch (e) {
    console.error('dbSave error:', e);
    return false;
  }
}

export async function dbSaveProgress() {
  return dbSave();
}

// Save or update a weekly note
export async function dbSaveNote(weekNumber, text) {
  const id = getCurrentUserId();
  if (!id) return false;

  try {
    const { error } = await sb()
      .from('notes')
      .upsert(
        { 
          user_id: id, 
          week_number: weekNumber, 
          content: text, 
          updated_at: new Date().toISOString() 
        },
        { onConflict: 'user_id, week_number' }
      );

    if (error) throw error;
    weekNotes[weekNumber] = text; // Update local state
    return true;
  } catch (e) {
    console.error('dbSaveNote error:', e);
    return false;
  }
}

// Delete all notes for current user
export async function dbDeleteAllNotes() {
  const id = getCurrentUserId();
  if (!id) return false;

  try {
    const { error } = await sb()
      .from('notes')
      .delete()
      .eq('user_id', id);

    if (error) throw error;
    for (const key in weekNotes) delete weekNotes[key]; // Clear local state
    return true;
  } catch (e) {
    console.error('dbDeleteAllNotes error:', e);
    return false;
  }
}

// Logout
export async function doLogout() {
  await sb().auth.signOut();
  resetState();
  window.location.href = 'index.html';
}
