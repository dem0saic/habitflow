export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function dateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function diffDays(a, b) {
  const msPerDay = 86400000;
  return Math.floor((new Date(b) - new Date(a)) / msPerDay);
}

export function formatDisplay(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

export function last7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}
