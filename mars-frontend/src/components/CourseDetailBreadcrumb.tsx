import { Link } from 'react-router-dom';
import { COURSE_MESSAGES } from '../constants/course';
import { ROUTES } from '../constants/routes';

type CourseDetailBreadcrumbProps = {
  courseName?: string | null;
};

export default function CourseDetailBreadcrumb({ courseName }: CourseDetailBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="font-label-sm text-label-sm text-on-surface-variant">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link to={ROUTES.ACADEMICIAN} className="hover:text-on-background transition-colors">
            {COURSE_MESSAGES.BREADCRUMB_ACADEMICIAN}
          </Link>
        </li>
        <li aria-hidden="true" className="text-on-surface-variant/60">
          ›
        </li>
        <li>
          <Link to={ROUTES.ACADEMICIAN_COURSES} className="hover:text-on-background transition-colors">
            {COURSE_MESSAGES.BREADCRUMB_COURSES}
          </Link>
        </li>
        <li aria-hidden="true" className="text-on-surface-variant/60">
          ›
        </li>
        <li className="text-on-background font-semibold truncate max-w-[16rem] sm:max-w-md">
          {courseName?.trim() || COURSE_MESSAGES.PAGE_TITLE_FALLBACK}
        </li>
      </ol>
    </nav>
  );
}
