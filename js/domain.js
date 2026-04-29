import { planState } from './state.js';
import { TOTAL_WEEKS } from './const.js';

export function nextSunday(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  if (day !== 0) {
    d.setDate(d.getDate() + (7 - day));
  }
  return d;
}

export function calculateWeekDates() {
  if (!planState.planStartDate) return null;
  const dates = {};
  
  let currentStart = nextSunday(new Date(planState.planStartDate));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!planState.weekCompletionHistory) planState.weekCompletionHistory = {};

  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const dStart = new Date(currentStart);
    const dEnd = new Date(currentStart);
    dEnd.setDate(dEnd.getDate() + 6);
    
    let delayed = false;
    if (w === planState.currentWeek) {
      const isDay0Marked = !!planState.completedDays[w + '-0'];
      if (!isDay0Marked && today > dStart) {
        delayed = true;
      }
    }
    
    dates[w] = { dateStart: dStart, dateEnd: dEnd, delayed: delayed };
    
    if (planState.weekCompletionHistory[w]) {
       let compDate = planState.weekCompletionHistory[w].completedAt || planState.weekCompletionHistory[w];
       currentStart = nextSunday(new Date(compDate));
    } else {
       currentStart = new Date(currentStart);
       currentStart.setDate(currentStart.getDate() + 7);
    }
  }
  return dates;
}

export function checkWeekCompletion(wn) {
  let daysCompleted = 0;
  for (let i = 0; i < 6; i++) {
    if (planState.completedDays[wn + '-' + i]) daysCompleted++;
  }
  const compCompleted = !!planState.completedComplements[wn];
  const isCompleted = (daysCompleted === 6 && compCompleted);
  
  if (!planState.weekCompletionHistory) planState.weekCompletionHistory = {};
  
  if (isCompleted && !planState.weekCompletionHistory[wn]) {
    const weekDates = calculateWeekDates();
    let daysElapsed = 0;
    let wasDelayed = false;
    if (weekDates && weekDates[wn]) {
      daysElapsed = Math.round((new Date() - new Date(weekDates[wn].dateStart)) / 86400000);
      wasDelayed = weekDates[wn].delayed;
    }
    planState.weekCompletionHistory[wn] = {
      completedAt: new Date().toISOString(),
      daysElapsed: daysElapsed,
      wasDelayed: wasDelayed
    };
    if (planState.currentWeek === wn) {
      planState.currentWeek = Math.min(wn + 1, TOTAL_WEEKS);
    }
  } else if (!isCompleted && planState.weekCompletionHistory[wn]) {
    delete planState.weekCompletionHistory[wn];
  }
}
