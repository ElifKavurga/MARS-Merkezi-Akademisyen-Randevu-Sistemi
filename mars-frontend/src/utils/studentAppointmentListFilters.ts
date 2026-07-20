import type { StudentAppointmentListItem } from '../types/studentAppointment';

export type StudentAppointmentSort =
  | 'DATE_ASC'
  | 'DATE_DESC'
  | 'CREATED_DESC'
  | 'CREATED_ASC';

export type StudentAppointmentListFilters = {
  search: string;
  status: string;
  meetingType: string;
  dateFrom: string;
  dateTo: string;
  sort: StudentAppointmentSort;
};

export const DEFAULT_STUDENT_APPOINTMENT_FILTERS: StudentAppointmentListFilters = {
  search: '',
  status: '',
  meetingType: '',
  dateFrom: '',
  dateTo: '',
  sort: 'DATE_ASC',
};

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLocaleLowerCase('tr-TR');
}

function matchesSearch(appointment: StudentAppointmentListItem, query: string): boolean {
  if (!query) {
    return true;
  }
  const haystack = [
    appointment.staffName,
    appointment.academicTitle,
    appointment.courseName,
    appointment.courseCode,
    appointment.categoryName,
  ]
    .map(normalize)
    .join(' ');
  return haystack.includes(query);
}

function matchesDateRange(
  appointment: StudentAppointmentListItem,
  dateFrom: string,
  dateTo: string,
): boolean {
  // Soft-correct inverted ranges so users still get results.
  const from = dateFrom && dateTo && dateFrom > dateTo ? dateTo : dateFrom;
  const to = dateFrom && dateTo && dateFrom > dateTo ? dateFrom : dateTo;
  const date = appointment.appointmentDate;
  if (from && date < from) {
    return false;
  }
  if (to && date > to) {
    return false;
  }
  return true;
}

function compareByDateTime(
  left: StudentAppointmentListItem,
  right: StudentAppointmentListItem,
): number {
  const byDate = left.appointmentDate.localeCompare(right.appointmentDate);
  if (byDate !== 0) {
    return byDate;
  }
  return left.startTime.localeCompare(right.startTime);
}

function compareByCreated(
  left: StudentAppointmentListItem,
  right: StudentAppointmentListItem,
): number {
  const leftCreated = left.createdAt ?? '';
  const rightCreated = right.createdAt ?? '';
  if (leftCreated && rightCreated) {
    return leftCreated.localeCompare(rightCreated);
  }
  if (leftCreated && !rightCreated) {
    return 1;
  }
  if (!leftCreated && rightCreated) {
    return -1;
  }
  return left.appointmentId - right.appointmentId;
}

export function filterAndSortStudentAppointments(
  appointments: StudentAppointmentListItem[],
  filters: StudentAppointmentListFilters,
): StudentAppointmentListItem[] {
  const query = normalize(filters.search);
  const filtered = appointments.filter((appointment) => {
    if (!matchesSearch(appointment, query)) {
      return false;
    }
    if (filters.status && appointment.appointmentStatus !== filters.status) {
      return false;
    }
    if (filters.meetingType && appointment.meetingType !== filters.meetingType) {
      return false;
    }
    return matchesDateRange(appointment, filters.dateFrom, filters.dateTo);
  });

  const sorted = [...filtered];
  sorted.sort((left, right) => {
    switch (filters.sort) {
      case 'DATE_DESC':
        return compareByDateTime(right, left);
      case 'CREATED_DESC':
        return compareByCreated(right, left);
      case 'CREATED_ASC':
        return compareByCreated(left, right);
      case 'DATE_ASC':
      default:
        return compareByDateTime(left, right);
    }
  });
  return sorted;
}

export function hasActiveStudentAppointmentFilters(
  filters: StudentAppointmentListFilters,
): boolean {
  return Boolean(
    filters.search.trim()
    || filters.status
    || filters.meetingType
    || filters.dateFrom
    || filters.dateTo,
  );
}
