export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

export function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
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