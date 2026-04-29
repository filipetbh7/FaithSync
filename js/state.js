export let planState = {
  completedDays: {},
  completedComplements: {},
  weekCompletionHistory: {},
  currentWeek: 1,
  planStartDate: null
};

export let weekNotes = {};
export let currentUserId = null;

export function getCurrentUserId() {
  return currentUserId;
}

export function setCurrentUserId(id) {
  currentUserId = id;
}

export function resetState() {
  planState = {
    completedDays: {},
    completedComplements: {},
    weekCompletionHistory: {},
    currentWeek: 1,
    planStartDate: null
  };
  weekNotes = {};
}
