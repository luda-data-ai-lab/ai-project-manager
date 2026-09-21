export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

export function formatDday(dateStr) {
  const days = daysUntil(dateStr);
  if (days === null) return '';
  if (days === 0) return 'D-day';
  return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
}
