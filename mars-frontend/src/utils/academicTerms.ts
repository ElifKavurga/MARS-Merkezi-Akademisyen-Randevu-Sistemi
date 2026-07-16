type TermSeason = 'Güz' | 'Bahar' | 'Yaz';

function formatAcademicTerm(startYear: number, season: TermSeason): string {
  return `${startYear}-${startYear + 1} ${season}`;
}

/**
 * Academic year starts in September.
 * e.g. Sep 2026 → 2026-2027; Jul 2026 → 2025-2026.
 */
function getCurrentAcademicYearStart(referenceDate: Date = new Date()): number {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth(); // 0-based; September = 8
  return month >= 8 ? year : year - 1;
}

/**
 * Builds a short academic-term dropdown list (~4–6 options):
 * - previous year: Bahar, Yaz
 * - current year: Güz, Bahar, Yaz
 * - next year: Güz
 */
export function getAcademicTermOptions(referenceDate: Date = new Date()): string[] {
  const currentStart = getCurrentAcademicYearStart(referenceDate);
  const previousStart = currentStart - 1;
  const nextStart = currentStart + 1;

  return [
    formatAcademicTerm(previousStart, 'Bahar'),
    formatAcademicTerm(previousStart, 'Yaz'),
    formatAcademicTerm(currentStart, 'Güz'),
    formatAcademicTerm(currentStart, 'Bahar'),
    formatAcademicTerm(currentStart, 'Yaz'),
    formatAcademicTerm(nextStart, 'Güz'),
  ];
}
