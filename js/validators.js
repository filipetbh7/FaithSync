const MIN_WEEK = 1;
const MAX_WEEK = 87;
const MIN_DAY = 0;
const MAX_DAY = 5;

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isWeekNumber(value) {
  return Number.isInteger(value) && value >= MIN_WEEK && value <= MAX_WEEK;
}

function isWeekKey(key) {
  const week = Number(key);
  return String(week) === key && isWeekNumber(week);
}

function isDayKey(key) {
  const parts = key.split('-');
  if (parts.length !== 2) return false;

  const week = Number(parts[0]);
  const day = Number(parts[1]);
  return String(week) === parts[0] &&
    String(day) === parts[1] &&
    isWeekNumber(week) &&
    Number.isInteger(day) &&
    day >= MIN_DAY &&
    day <= MAX_DAY;
}

function isValidIsoDateString(value) {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}(?:T.+)?$/.test(value)) return false;

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return false;

  const parsed = new Date(timestamp);
  return parsed.toISOString().slice(0, 10) === value.slice(0, 10);
}

function validateBooleanMap(value, keyValidator, fieldName, errors) {
  if (!isObject(value)) {
    errors.push(fieldName + ' deve ser um objeto.');
    return;
  }

  Object.keys(value).forEach(key => {
    if (!keyValidator(key)) {
      errors.push(fieldName + ' contem chave invalida: ' + key + '.');
    }
    if (typeof value[key] !== 'boolean') {
      errors.push(fieldName + '[' + key + '] deve ser boolean.');
    }
  });
}

export function validateImportState(data) {
  const errors = [];

  if (!isObject(data)) {
    return { valid: false, errors: ['Estado do backup deve ser um objeto.'] };
  }

  if (!isWeekNumber(data.currentWeek)) {
    errors.push('currentWeek deve ser um inteiro entre 1 e 87.');
  }

  if (!isValidIsoDateString(data.planStartDate)) {
    errors.push('planStartDate deve ser uma ISO date string valida.');
  }

  validateBooleanMap(data.completedDays, isDayKey, 'completedDays', errors);
  validateBooleanMap(data.completedComplements, isWeekKey, 'completedComplements', errors);

  if (!isObject(data.weekCompletionHistory)) {
    errors.push('weekCompletionHistory deve ser um objeto.');
  } else {
    Object.keys(data.weekCompletionHistory).forEach(key => {
      if (!isWeekKey(key)) {
        errors.push('weekCompletionHistory contem chave invalida: ' + key + '.');
      }
      if (!isValidIsoDateString(data.weekCompletionHistory[key])) {
        errors.push('weekCompletionHistory[' + key + '] deve ser uma ISO date string valida.');
      }
    });
  }

  return { valid: errors.length === 0, errors: errors };
}

function hasValidDay(day) {
  return isObject(day) &&
    isNonEmptyString(day.dayOfWeek) &&
    isNonEmptyString(day.reading) &&
    isNonEmptyString(day.context) &&
    !Object.prototype.hasOwnProperty.call(day, 'date');
}

function hasValidComplement(complement, skeleton) {
  if (!isObject(complement)) return false;
  if (skeleton) return true;
  return isNonEmptyString(complement.intro) &&
    Array.isArray(complement.resources) &&
    complement.resources.every(resource =>
      isObject(resource) &&
      isNonEmptyString(resource.type) &&
      isNonEmptyString(resource.title) &&
      Array.isArray(resource.items) &&
      resource.items.every(isNonEmptyString)
    );
}

function hasValidReflection(reflection, skeleton) {
  if (!isObject(reflection)) return false;
  if (skeleton) return true;
  return isNonEmptyString(reflection.verse) &&
    isNonEmptyString(reflection.reference) &&
    isNonEmptyString(reflection.question);
}

export function validateWeekContent(week) {
  if (!isObject(week)) return false;
  if (!Number.isInteger(week.number)) return false;
  if (!isNonEmptyString(week.title)) return false;
  if (!isNonEmptyString(week.book)) return false;
  if (!Array.isArray(week.days)) return false;
  if (!isObject(week.complement)) return false;
  if (!isObject(week.reflection)) return false;

  const skeleton = week.skeleton === true;
  if (!skeleton && week.days.length === 0) return false;
  if (!skeleton && !week.days.every(hasValidDay)) return false;
  if (!hasValidComplement(week.complement, skeleton)) return false;
  if (!hasValidReflection(week.reflection, skeleton)) return false;

  if (Object.prototype.hasOwnProperty.call(week, 'visualType') && !isObject(week.visualData)) {
    return false;
  }

  return true;
}
