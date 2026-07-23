import { Link } from 'react-router-dom';
import { STUDENT_UI } from '../constants/studentUi';

type StudentBackLinkProps = {
  to: string;
  label: string;
};

export default function StudentBackLink({ to, label }: StudentBackLinkProps) {
  return (
    <Link to={to} className={`${STUDENT_UI.BACK_LINK_CLASS} mars-back-link`} style={{ textDecoration: 'none' }}>
      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
        arrow_back
      </span>
      {label}
    </Link>
  );
}
