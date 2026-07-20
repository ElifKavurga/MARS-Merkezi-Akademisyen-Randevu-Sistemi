import StudentBreadcrumb from '../components/StudentBreadcrumb';
import StudentEmptyState from '../components/StudentEmptyState';
import StudentPageHeader from '../components/StudentPageHeader';
import { STUDENT_APPOINTMENT_MESSAGES } from '../constants/studentAppointment';
import { ROUTES } from '../constants/routes';
import { STUDENT_UI } from '../constants/studentUi';

export default function StudentAppointmentsPage() {
  return (
    <div className="w-full min-w-0 animate-fade-in">
      <StudentBreadcrumb
        items={[
          { label: STUDENT_UI.BREADCRUMB_HOME, to: ROUTES.STUDENT },
          { label: STUDENT_UI.BREADCRUMB_APPOINTMENTS },
        ]}
      />
      <StudentPageHeader
        title={STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_TITLE}
        description={STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_SUBTITLE}
      />
      <StudentEmptyState
        icon="event_note"
        title={STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_EMPTY_TITLE}
        description={STUDENT_APPOINTMENT_MESSAGES.MY_APPOINTMENTS_EMPTY_DESCRIPTION}
      />
    </div>
  );
}
