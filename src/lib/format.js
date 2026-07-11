import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function bytes(n, digits = 1) {
  if (n == null) return '—';
  if (n === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / 1024 ** i).toFixed(digits)} ${units[i]}`;
}

export function number(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat().format(n);
}

export function duration(seconds) {
  if (seconds == null) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m || (!d && !h)) parts.push(`${m}m`);
  return parts.join(' ');
}

export function fromNow(date) {
  return date ? dayjs(date).fromNow() : '—';
}

export function dateTime(date) {
  return date ? dayjs(date).format('MMM D, YYYY · HH:mm') : '—';
}

export function date(d) {
  return d ? dayjs(d).format('MMM D, YYYY') : '—';
}
