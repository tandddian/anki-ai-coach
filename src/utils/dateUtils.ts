export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

export function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

export function getDueDate(interval: number, fromDate: Date): Date {
  const dueDate = new Date(fromDate);
  dueDate.setDate(dueDate.getDate() + interval);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate;
}

export function parseDateString(dateStr: string): Date {
  const normalized = dateStr.replace(/\//g, '-');
  return new Date(normalized + 'T00:00:00');
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function getFirstDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

export function getLastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function buildCalendarGrid(year: number, month: number): (Date | null)[] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);
  const grid: (Date | null)[] = [];

  const prevMonthDays = getDaysInMonth(year, month - 1);
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    grid.push(new Date(year, month - 1, prevMonthDays - i));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    grid.push(new Date(year, month, day));
  }

  const remainingCells = 42 - grid.length;
  for (let day = 1; day <= remainingCells; day++) {
    grid.push(new Date(year, month + 1, day));
  }

  return grid;
}

export function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function compareDates(a: string, b: string): number {
  return new Date(a).getTime() - new Date(b).getTime();
}