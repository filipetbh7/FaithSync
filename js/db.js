// js/db.js – Database access layer

function sb() {
  if (!window._supabase) {
    window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  }
  return window._supabase;
}

// Get current user session
async function getUser() {
  const { data: { session } } = await sb().auth.getSession();
  if (!session) {
    window.location.href = 'index.html?err=session';
    return null;
  }
  return session.user;
}

// Load all progress & notes for the current user
async function dbLoad(uid) {
  if (uid) UID = uid; // Set global UID from argument if provided
  const id = getUID();
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
      ST.completedDays = progData.data.completedDays || {};
      ST.completedComplements = progData.data.completedComplements || {};
      ST.weekCompletionHistory = progData.data.weekCompletionHistory || {};
      ST.currentWeek = progData.data.currentWeek || 32;
      ST.planStartDate = progData.data.planStartDate || null;
    }

    // 2. Load Notes
    const { data: notesData, error: notesError } = await sb()
      .from('notes')
      .select('week_number, content')
      .eq('user_id', id);

    if (notesError) throw notesError;

    // Reset notes before loading
    NT_NOTES = {};
    if (notesData) {
      notesData.forEach(row => {
        NT_NOTES[row.week_number] = row.content;
      });
    }

    return true;
  } catch (e) {
    console.error('dbLoad error:', e);
    return false;
  }
}

// Save progress
async function dbSave() {
  const id = getUID();
  if (!id) return false;

  try {
    const progressData = {
      ...ST,
      planStartDate: ST.planStartDate || null
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

async function dbSaveProgress() {
  return dbSave();
}

// Save or update a weekly note
async function dbSaveNote(weekNumber, text) {
  const id = getUID();
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
    NT_NOTES[weekNumber] = text; // Update local state
    return true;
  } catch (e) {
    console.error('dbSaveNote error:', e);
    return false;
  }
}

// Delete all notes for current user
async function dbDeleteAllNotes() {
  const id = getUID();
  if (!id) return false;

  try {
    const { error } = await sb()
      .from('notes')
      .delete()
      .eq('user_id', id);

    if (error) throw error;
    NT_NOTES = {}; // Clear local state
    return true;
  } catch (e) {
    console.error('dbDeleteAllNotes error:', e);
    return false;
  }
}

// Logout
async function doLogout() {
  await sb().auth.signOut();
  window.location.href = 'index.html';
}
