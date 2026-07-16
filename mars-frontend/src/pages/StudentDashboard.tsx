import { Link } from 'react-router-dom';
import RoleWelcomeView from '../components/RoleWelcomeView';
import { ROUTES } from '../constants/routes';

export default function StudentDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <RoleWelcomeView />
      <div className="max-w-xl">
        <Link
          to={ROUTES.STUDENT_APPOINTMENT_CREATE}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0b1641] px-4 py-2 font-label-md text-label-md text-white hover:bg-[#152a5c] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            event_available
          </span>
          Randevu Talebi Oluştur
        </Link>
      </div>
    </div>
  );
}
