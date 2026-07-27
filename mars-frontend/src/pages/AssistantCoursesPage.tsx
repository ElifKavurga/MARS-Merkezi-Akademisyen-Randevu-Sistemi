import { useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import Loading from '../components/Loading';
import { ASSISTANT_COURSE_MESSAGES } from '../constants/assistantCourse';
import { FORM_FIELD_CLASS, FORM_SEARCH_ICON_CLASS, FORM_SELECT_CLASS } from '../constants/ui';
import { useToast } from '../hooks/useToast';
import { getAssistantCourses } from '../services/assistantCourseService';
import type { AssistantAssignedCourse } from '../types/assistantCourse';

export default function AssistantCoursesPage() {
  const toast = useToast();
  const [courses, setCourses] = useState<AssistantAssignedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [termFilter, setTermFilter] = useState('');

  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        setCourses(await getAssistantCourses());
      } catch (err) {
        const message =
          isAxiosError(err) && err.response?.status === 403
            ? ASSISTANT_COURSE_MESSAGES.ACCESS_DENIED
            : ASSISTANT_COURSE_MESSAGES.LOAD_ERROR;
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadCourses();
  }, [toast]);

  const termOptions = useMemo(
    () =>
      Array.from(new Set(courses.map((course) => course.academicTerm).filter(Boolean))).sort(
        (left, right) => left.localeCompare(right, 'tr-TR'),
      ),
    [courses],
  );

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('tr-TR');
    return courses.filter((course) => {
      if (termFilter && course.academicTerm !== termFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        course.courseCode.toLocaleLowerCase('tr-TR').includes(query)
        || course.courseName.toLocaleLowerCase('tr-TR').includes(query)
      );
    });
  }, [courses, searchQuery, termFilter]);

  return (
    <div className="admin-page animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-background">
          {ASSISTANT_COURSE_MESSAGES.TITLE}
        </h1>
        
      </div>

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="flex flex-col gap-3 border-b border-outline-variant p-4 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <span
              className={FORM_SEARCH_ICON_CLASS}
              aria-hidden="true"
            >
              search
            </span>
            <input
              type="search"
              className={`${FORM_FIELD_CLASS} pl-10`}
              placeholder={ASSISTANT_COURSE_MESSAGES.SEARCH_PLACEHOLDER}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <select
            className={`${FORM_SELECT_CLASS} w-full sm:w-56`}
            aria-label="Akademik dönem filtresi"
            value={termFilter}
            onChange={(event) => setTermFilter(event.target.value)}
          >
            <option value="">{ASSISTANT_COURSE_MESSAGES.TERM_FILTER_ALL}</option>
            {termOptions.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loading label="Atandığınız dersler yükleniyor..." />
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <p className="font-body-md text-body-md text-error" role="alert">
              {error}
            </p>
          </div>
        ) : courses.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span
              className="material-symbols-outlined text-[42px] text-on-surface-variant/50"
              aria-hidden="true"
            >
              menu_book
            </span>
            <h2 className="mt-3 font-headline-md text-headline-md text-on-background">
              {ASSISTANT_COURSE_MESSAGES.EMPTY_TITLE}
            </h2>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              {ASSISTANT_COURSE_MESSAGES.EMPTY_DESCRIPTION}
            </p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              {ASSISTANT_COURSE_MESSAGES.EMPTY_FILTER}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container/40">
                  <th className="px-6 py-4 text-left font-label-md text-label-md font-semibold text-on-surface-variant">
                    Ders Kodu
                  </th>
                  <th className="px-6 py-4 text-left font-label-md text-label-md font-semibold text-on-surface-variant">
                    Ders Adı
                  </th>
                  <th className="px-6 py-4 text-left font-label-md text-label-md font-semibold text-on-surface-variant">
                    Dönem
                  </th>
                  <th className="px-6 py-4 text-left font-label-md text-label-md font-semibold text-on-surface-variant">
                    Sorumlu Akademisyen
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr
                    key={course.courseId}
                    className="border-b border-outline-variant/40 transition-colors hover:bg-surface-container/30"
                  >
                    <td className="px-6 py-4 font-label-md text-label-md font-semibold text-on-background">
                      {course.courseCode}
                    </td>
                    <td className="px-6 py-4 font-body-md text-body-md text-on-background">
                      {course.courseName}
                    </td>
                    <td className="px-6 py-4 font-body-md text-body-md text-on-background">
                      {course.academicTerm}
                    </td>
                    <td className="px-6 py-4 font-body-md text-body-md text-on-background">
                      {course.ownerAcademicianName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
