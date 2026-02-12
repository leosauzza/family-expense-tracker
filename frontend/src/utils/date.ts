export const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function getMonthName(month: number, locale: 'es' | 'en' = 'es'): string {
  const names = locale === 'es' ? MONTH_NAMES_ES : MONTH_NAMES_EN;
  return names[month - 1] || '';
}

export function getCurrentMonthYear(): { year: number; month: number } {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1
  };
}

export function formatMonthYear(year: number, month: number, locale: 'es' | 'en' = 'es'): string {
  const monthName = getMonthName(month, locale);
  return `${monthName} ${year}`;
}

export function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

export function getNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}

export function formatMonthYearForUrl(year: number, month: number): string {
  return `${year}-${month.toString().padStart(2, '0')}`;
}

export function parseMonthYearFromUrl(param: string): { year: number; month: number } | null {
  const match = param.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  
  if (month < 1 || month > 12) return null;
  
  return { year, month };
}
