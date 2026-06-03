export function toDate(value) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return '-';
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function addMinutes(value, minutes) {
  const date = toDate(value);
  if (!date) return null;
  return new Date(date.getTime() + minutes * 60 * 1000);
}
