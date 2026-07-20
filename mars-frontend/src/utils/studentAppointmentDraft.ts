import type { StudentAppointmentDraft } from '../types/studentAppointment';

function storageKey(academicianId: number): string {
  return `mars.student.appointment.draft.${academicianId}`;
}

export function loadStudentAppointmentDraft(
  academicianId: number,
): StudentAppointmentDraft | null {
  try {
    const raw = sessionStorage.getItem(storageKey(academicianId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StudentAppointmentDraft;
    if (
      typeof parsed.categoryId !== 'number' ||
      typeof parsed.categoryName !== 'string' ||
      typeof parsed.durationMinutes !== 'number' ||
      typeof parsed.requiresCourseSelection !== 'boolean'
    ) {
      return null;
    }
    return {
      ...parsed,
      courseId: typeof parsed.courseId === 'number' ? parsed.courseId : null,
      courseCode: typeof parsed.courseCode === 'string' ? parsed.courseCode : null,
      courseName: typeof parsed.courseName === 'string' ? parsed.courseName : null,
      slotId: typeof parsed.slotId === 'number' ? parsed.slotId : null,
      slotDate: typeof parsed.slotDate === 'string' ? parsed.slotDate : null,
      startTime: typeof parsed.startTime === 'string' ? parsed.startTime : null,
      endTime: typeof parsed.endTime === 'string' ? parsed.endTime : null,
      slotMeetingType:
        typeof parsed.slotMeetingType === 'string' ? parsed.slotMeetingType : null,
      meetingType: typeof parsed.meetingType === 'string' ? parsed.meetingType : null,
    };
  } catch {
    return null;
  }
}

export function saveStudentAppointmentDraft(
  academicianId: number,
  draft: StudentAppointmentDraft,
): void {
  sessionStorage.setItem(storageKey(academicianId), JSON.stringify(draft));
}

export function clearStudentAppointmentDraft(academicianId: number): void {
  sessionStorage.removeItem(storageKey(academicianId));
}
