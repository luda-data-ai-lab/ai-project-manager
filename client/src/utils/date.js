export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

export function daysBetween(fromStr, toStr) {
  if (!fromStr || !toStr) return null;
  const from = new Date(`${fromStr}T00:00:00`);
  const to = new Date(`${toStr}T00:00:00`);
  return Math.round((to - from) / 86400000);
}

export function formatProjectSchedule(project) {
  if (project.status !== 'completed') return formatDday(project.target_date);
  const days = daysBetween(project.start_date, project.target_date);
  return days === null ? '완료' : `완료 · ${days}일 소요`;
}

export function formatDday(dateStr) {
  const days = daysUntil(dateStr);
  if (days === null) return '';
  if (days === 0) return 'D-day';
  return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
}
