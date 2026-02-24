import { addMonths, format, isValid, parse, parseISO } from 'date-fns';

function parseDateLike(value?: string | null): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsed = parse(trimmed, 'yyyy-MM-dd', new Date());
    return isValid(parsed) ? parsed : null;
  }

  if (trimmed.includes('T')) {
    const parsed = parseISO(trimmed);
    return isValid(parsed) ? parsed : null;
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function calculateAge(birthDate?: string | null): number | null {
  const birth = parseDateLike(birthDate);
  if (!birth) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (!Number.isFinite(age) || age < 0 || age > 150) return null;
  return age;
}

export function toValidDate(value?: string | null): Date | null {
  return parseDateLike(value);
}

export function formatDate(value?: string | null, fallback = '-') {
  const date = toValidDate(value);
  if (!date) return fallback;
  return format(date, 'dd/MM/yyyy');
}

export function getNextPaymentDateString(base?: string | null, fallback = '-') {
  const date = toValidDate(base);
  if (!date) return fallback;
  return format(addMonths(date, 1), 'dd/MM/yyyy');
}
