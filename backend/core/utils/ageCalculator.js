/**
 * Centralized Age Calculation Utility - IST (Indian Standard Time) Support
 * 
 * This utility handles all age-related calculations for pets across the platform.
 * It provides functions to:
 * - Convert age + ageUnit inputs to estimated date of birth
 * - Calculate current age from date of birth
 * - Format age displays in various units
 * - Handle timezone consistency (IST - UTC+5:30)
 * - Smart month-end overflow handling
 */

// IST Offset: +5:30 hours from UTC
const IST_OFFSET_HOURS = 5;
const IST_OFFSET_MINUTES = 30;

/**
 * Get current date in IST (Indian Standard Time)
 * @returns {Date} - Current date/time in IST
 */
function getISTDate() {
  const now = new Date();
  
  // Get UTC time
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  
  // Convert to IST (UTC + 5:30)
  const istOffset = (IST_OFFSET_HOURS * 60 + IST_OFFSET_MINUTES) * 60000;
  const istDate = new Date(utc + istOffset);
  
  return istDate;
}

/**
 * Normalize any date to IST midnight (00:00:00)
 * @param {Date} date - The date to normalize
 * @returns {Date} - Date set to IST midnight
 */
function normalizeToISTMidnight(date) {
  if (!date) return null;
  
  const d = new Date(date);
  // Set to midnight IST
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Handle month-end overflow intelligently
 * Example: Jan 31 - 1 month should be Dec 31, not Jan 3
 * @param {Date} date - The date to adjust
 * @returns {Date} - Adjusted date
 */
function handleMonthEndOverflow(date) {
  const d = new Date(date);
  const targetMonth = d.getMonth();
  
  // Check if month overflowed (e.g., Feb 31 became Mar 3)
  // This can happen when setting a date that doesn't exist in the target month
  const lastDayOfTargetMonth = new Date(d.getFullYear(), targetMonth + 1, 0).getDate();
  
  // If we're beyond the last day of the target month, cap it
  if (d.getDate() > lastDayOfTargetMonth) {
    d.setDate(lastDayOfTargetMonth);
  }
  
  return d;
}

/**
 * Convert age value and unit to an estimated date of birth
 * Uses CALENDAR-BASED calculation for accurate month/year handling with IST timezone
 * @param {Number} age - The age value
 * @param {String} ageUnit - The unit ('days', 'weeks', 'months', 'years')
 * @returns {Date} - The estimated date of birth in IST
 */
function convertAgeToDOB(age, ageUnit = 'months') {
  if (!age || age < 0) {
    return null;
  }

  const now = getISTDate(); // Use IST instead of local time
  const dob = new Date(now);

  switch (ageUnit.toLowerCase()) {
    case 'days':
      // Subtract days using calendar
      dob.setDate(dob.getDate() - age);
      break;
      
    case 'weeks':
      // Subtract weeks (7 days each) using calendar
      dob.setDate(dob.getDate() - (age * 7));
      break;
      
    case 'months': {
      // Subtract months using calendar - handles variable month lengths
      const originalDay = dob.getDate();
      dob.setMonth(dob.getMonth() - age);
      
      // Handle month-end overflow (e.g., Jan 31 - 1 month = Dec 31, not Jan 3)
      const newMonth = dob.getMonth();
      const lastDayOfNewMonth = new Date(dob.getFullYear(), newMonth + 1, 0).getDate();
      
      if (originalDay > lastDayOfNewMonth) {
        dob.setDate(lastDayOfNewMonth);
      }
      break;
    }
      
    case 'years': {
      // Subtract years using calendar - handles leap years automatically
      const originalDay = dob.getDate();
      const originalMonth = dob.getMonth();
      dob.setFullYear(dob.getFullYear() - age);
      
      // Handle Feb 29 on non-leap years
      if (originalMonth === 1 && originalDay === 29) {
        const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        if (!isLeapYear(dob.getFullYear())) {
          dob.setDate(28); // Set to Feb 28 on non-leap years
        }
      }
      break;
    }
      
    default: {
      // Default to months
      const originalDay = dob.getDate();
      dob.setMonth(dob.getMonth() - age);
      
      const newMonth = dob.getMonth();
      const lastDayOfNewMonth = new Date(dob.getFullYear(), newMonth + 1, 0).getDate();
      
      if (originalDay > lastDayOfNewMonth) {
        dob.setDate(lastDayOfNewMonth);
      }
    }
  }
  
  // Normalize to IST midnight
  return normalizeToISTMidnight(dob);
}

/**
 * Calculate age from date of birth in specified unit
 * Uses CALENDAR-BASED calculation for months and years with IST timezone
 * @param {Date} dateOfBirth - The date of birth
 * @param {String} unit - The desired unit ('days', 'weeks', 'months', 'years')
 * @returns {Number} - The calculated age in the specified unit
 */
function calculateAgeFromDOB(dateOfBirth, unit = 'months') {
  if (!dateOfBirth) {
    return 0;
  }

  const now = getISTDate(); // Use IST instead of local time
  const dob = normalizeToISTMidnight(dateOfBirth);
  
  // Handle future dates
  if (dob > now) {
    return 0;
  }

  const diffTime = Math.abs(now - dob);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  switch (unit.toLowerCase()) {
    case 'days':
      return diffDays;
      
    case 'weeks':
      return Math.floor(diffDays / 7);
      
    case 'months': {
      // Calendar-based month calculation
      let months = (now.getFullYear() - dob.getFullYear()) * 12;
      months += now.getMonth() - dob.getMonth();
      
      // Adjust if current day is before birth day in the month
      if (now.getDate() < dob.getDate()) {
        months--;
      }
      
      return Math.max(0, months);
    }
      
    case 'years': {
      // Calendar-based year calculation
      let years = now.getFullYear() - dob.getFullYear();
      
      // Adjust if birthday hasn't occurred this year yet
      const birthdayThisYear = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      if (now < birthdayThisYear) {
        years--;
      }
      
      return Math.max(0, years);
    }
      
    default: {
      // Default to months (calendar-based)
      let months = (now.getFullYear() - dob.getFullYear()) * 12;
      months += now.getMonth() - dob.getMonth();
      if (now.getDate() < dob.getDate()) {
        months--;
      }
      return Math.max(0, months);
    }
  }
}

/**
 * Get age breakdown (years, months, days) from date of birth
 * @param {Date} dateOfBirth - The date of birth
 * @returns {Object} - Object with years, months, days, totalDays
 */
function getAgeBreakdown(dateOfBirth) {
  if (!dateOfBirth) {
    return { years: 0, months: 0, days: 0, totalDays: 0 };
  }

  const now = getISTDate(); // Use IST
  const dob = normalizeToISTMidnight(dateOfBirth);
  
  if (dob > now) {
    return { years: 0, months: 0, days: 0, totalDays: 0 };
  }

  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  let days = now.getDate() - dob.getDate();

  // Adjust for negative days
  if (days < 0) {
    months--;
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += lastMonth.getDate();
  }

  // Adjust for negative months
  if (months < 0) {
    years--;
    months += 12;
  }

  const totalDays = Math.floor((now - dob) / (1000 * 60 * 60 * 24));

  return { years, months, days, totalDays };
}

/**
 * Format age for display based on the most appropriate unit
 * @param {Date} dateOfBirth - The date of birth
 * @param {String} preferredUnit - Optional preferred unit to display
 * @returns {String} - Formatted age string (e.g., "2 years 3 months", "5 weeks", "3 days")
 */
function formatAge(dateOfBirth, preferredUnit = null) {
  if (!dateOfBirth) {
    return 'Unknown';
  }

  const breakdown = getAgeBreakdown(dateOfBirth);
  const { years, months, days, totalDays } = breakdown;

  // If preferred unit is specified, use it
  if (preferredUnit) {
    const age = calculateAgeFromDOB(dateOfBirth, preferredUnit);
    return formatAgeWithUnit(age, preferredUnit);
  }

  // Auto-detect best format
  if (years >= 1) {
    if (months > 0) {
      return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
    }
    return `${years} year${years !== 1 ? 's' : ''}`;
  }

  if (months >= 1) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  }

  if (totalDays >= 7) {
    const weeks = Math.floor(totalDays / 7);
    return `${weeks} week${weeks !== 1 ? 's' : ''}`;
  }

  return `${totalDays} day${totalDays !== 1 ? 's' : ''}`;
}

/**
 * Format age with specific unit
 * @param {Number} age - The age value
 * @param {String} unit - The unit
 * @returns {String} - Formatted string
 */
function formatAgeWithUnit(age, unit) {
  const n = age || 0;
  const unitMap = {
    'days': 'day',
    'weeks': 'week',
    'months': 'month',
    'years': 'year'
  };
  
  const singular = unitMap[unit.toLowerCase()] || unit;
  return `${n} ${singular}${n !== 1 ? 's' : ''}`;
}

/**
 * Get age in multiple units
 * @param {Date} dateOfBirth - The date of birth
 * @returns {Object} - Object with age in all units
 */
function getAgeInAllUnits(dateOfBirth) {
  if (!dateOfBirth) {
    return {
      days: 0,
      weeks: 0,
      months: 0,
      years: 0,
      breakdown: { years: 0, months: 0, days: 0, totalDays: 0 }
    };
  }

  return {
    days: calculateAgeFromDOB(dateOfBirth, 'days'),
    weeks: calculateAgeFromDOB(dateOfBirth, 'weeks'),
    months: calculateAgeFromDOB(dateOfBirth, 'months'),
    years: calculateAgeFromDOB(dateOfBirth, 'years'),
    breakdown: getAgeBreakdown(dateOfBirth)
  };
}

/**
 * Determine if a DOB is estimated or exact
 * This is a helper for validation
 * @param {Date} dateOfBirth - The date of birth
 * @param {Boolean} wasConvertedFromAge - Whether this DOB was created from age conversion
 * @returns {String} - 'exact' or 'estimated'
 */
function determineDOBAccuracy(dateOfBirth, wasConvertedFromAge = false) {
  if (wasConvertedFromAge) {
    return 'estimated';
  }
  return 'exact';
}

/**
 * Validate date of birth
 * @param {Date} dateOfBirth - The date to validate
 * @returns {Object} - { valid: boolean, error: string|null }
 */
function validateDOB(dateOfBirth) {
  if (!dateOfBirth) {
    return { valid: false, error: 'Date of birth is required' };
  }

  const dob = new Date(dateOfBirth);
  
  if (isNaN(dob.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  const now = getISTDate();
  
  if (dob > now) {
    return { valid: false, error: 'Date of birth cannot be in the future' };
  }

  // Check if date is too old (e.g., 100 years for pets is unreasonable)
  const maxAge = new Date(now);
  maxAge.setFullYear(maxAge.getFullYear() - 100);
  
  if (dob < maxAge) {
    return { valid: false, error: 'Date of birth is too far in the past' };
  }

  return { valid: true, error: null };
}

module.exports = {
  convertAgeToDOB,
  calculateAgeFromDOB,
  getAgeBreakdown,
  formatAge,
  formatAgeWithUnit,
  getAgeInAllUnits,
  determineDOBAccuracy,
  getISTDate,
  normalizeToISTMidnight,
  validateDOB
};
