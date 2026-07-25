export const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function dateOnly(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return value.toISOString().slice(0, 10);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function getMonthId(date: string): string {
  return date.slice(0, 7);
}

export function eachDay(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  let cursor = startDate;
  while (cursor <= endDate) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function formatDateLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return `${monthNames[month - 1]} ${day}, ${year}`;
}

export function dateInputValue(value = new Date()): string {
  return value.toISOString().slice(0, 10);
}
