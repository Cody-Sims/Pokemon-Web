export type PlaytimeFormat = 'clock' | 'hours-minutes' | 'trainer-card';

export interface MoneyFormatOptions {
  currency?: string;
  space?: boolean;
  useGrouping?: boolean;
}

function finiteInteger(value: number): number {
  return Number.isFinite(value) ? Math.trunc(value) : 0;
}

export function capitalize(value: string): string {
  if (value.length === 0) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function titleCase(value: string): string {
  return value
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => capitalize(word.toLowerCase()))
    .join(' ');
}

export function padNumber(value: number, width = 2): string {
  const integer = finiteInteger(value);
  const sign = integer < 0 ? '-' : '';
  return `${sign}${Math.abs(integer).toString().padStart(Math.max(0, width), '0')}`;
}

export function formatDexNumber(id: number, width = 3): string {
  return `#${padNumber(id, width)}`;
}

export function formatMoney(amount: number, options: MoneyFormatOptions = {}): string {
  const {
    currency = '₽',
    space = true,
    useGrouping = true,
  } = options;
  const integer = finiteInteger(amount);
  const formatted = useGrouping ? integer.toLocaleString('en-US') : integer.toString();
  return `${currency}${space ? ' ' : ''}${formatted}`;
}

export function formatTime(totalSeconds: number, includeHours: 'auto' | 'always' | 'never' = 'auto'): string {
  const seconds = Math.max(0, finiteInteger(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (includeHours === 'always' || (includeHours === 'auto' && hours > 0)) {
    return `${hours}:${padNumber(minutes)}:${padNumber(remainingSeconds)}`;
  }

  return `${minutes}:${padNumber(remainingSeconds)}`;
}

export function formatClockTime(totalMinutes: number): string {
  const minutes = Math.max(0, finiteInteger(totalMinutes));
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  return `${padNumber(hour)}:${padNumber(minute)}`;
}

export function formatPlaytime(totalSeconds: number, format: PlaytimeFormat = 'clock'): string {
  const seconds = Math.max(0, finiteInteger(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (format === 'hours-minutes') {
    return `${hours}h ${minutes}m`;
  }

  if (format === 'trainer-card') {
    return `${padNumber(hours)}:${padNumber(minutes)}`;
  }

  return formatTime(seconds, 'auto');
}
