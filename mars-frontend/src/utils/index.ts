export function isBlank(value: string | null | undefined): boolean {
  return value == null || value.trim().length === 0;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('tr-TR');
}
