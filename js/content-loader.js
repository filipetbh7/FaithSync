import { WEEKS_INDEX } from './const.js';
import { validateWeekContent } from './validators.js';

const loadedWeeks = new Map();

function getWeekFile(weekNumber) {
  const indexEntry = WEEKS_INDEX[weekNumber - 1];
  return indexEntry && indexEntry.weekFile
    ? indexEntry.weekFile
    : 'week-' + String(weekNumber).padStart(2, '0');
}

async function fetchWeekJson(weekFile) {
  const path = new URL('../data/weeks/' + weekFile + '.json', import.meta.url);

  try {
    const response = await fetch(path);
    if (response.ok) return await response.json();
    console.warn('Week content fetch failed:', response.status, path.href);
  } catch (err) {
    console.warn('Week content fetch failed:', path.href, err);
  }

  return null;
}

async function attachVisualRenderer(weekData) {
  if (!weekData.visualType || !weekData.book) return weekData;

  try {
    const { render } = await import('./content/' + weekData.book + '.js');
    weekData._renderVisual = typeof render === 'function' ? render : null;
  } catch (err) {
    console.warn('Visual renderer unavailable:', weekData.book, err);
    weekData._renderVisual = null;
  }

  return weekData;
}

export async function loadWeek(weekNumber) {
  if (loadedWeeks.has(weekNumber)) return loadedWeeks.get(weekNumber);

  const weekFile = getWeekFile(weekNumber);
  const weekData = await fetchWeekJson(weekFile);
  if (!validateWeekContent(weekData) || weekData.number !== weekNumber) return null;

  await attachVisualRenderer(weekData);
  loadedWeeks.set(weekNumber, weekData);
  return weekData;
}
