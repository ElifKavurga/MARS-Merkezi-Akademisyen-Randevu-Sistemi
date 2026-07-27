import AcademicianAppointmentsPage from './AcademicianAppointmentsPage';
import { assistantAppointmentDetailPath } from '../constants/routes';

export default function AssistantAppointmentsPage() {
  return (
    <AcademicianAppointmentsPage
      scope="assistant"
      detailPath={assistantAppointmentDetailPath}
      searchInputId="assistant-appt-search"
    />
  );
}
