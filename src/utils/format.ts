import type { UserStatus } from '../types/models';

export function formatCurrency(value: number, currency = 'COP') {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export function statusTone(status: UserStatus) {
  if (status === 'active') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'suspended') return 'danger';
  return 'neutral';
}
