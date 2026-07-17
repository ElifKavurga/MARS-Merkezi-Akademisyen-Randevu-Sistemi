import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Link } from 'react-router-dom';
import Loading from '../components/Loading';
import { ASSISTANT_DASHBOARD_MESSAGES } from '../constants/assistantCourse';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getAssistantDashboard } from '../services/assistantCourseService';
import type { AssistantDashboardSummary } from '../types/assistantCourse';

export default function AssistantDashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [summary, setSummary] = useState<AssistantDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        setSummary(await getAssistantDashboard());
      } catch (err) {
        const message =
          isAxiosError(err) && err.response?.status === 403
            ? ASSISTANT_DASHBOARD_MESSAGES.ACCESS_DENIED
            : ASSISTANT_DASHBOARD_MESSAGES.LOAD_ERROR;
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [toast]);

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 animate-fade-in">
      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="border-b border-outline-variant bg-[#0b1641] px-5 py-6 text-white sm:px-8 sm:py-8">
          <p className="font-label-md text-label-md text-white/70">
            {ASSISTANT_DASHBOARD_MESSAGES.PANEL_LABEL}
          </p>
          <h1 className="mt-1 font-headline-lg text-headline-lg text-white">
            Hoş Geldiniz{user?.fullName ? `, ${user.fullName}` : ''}
          </h1>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
              <span className="material-symbols-outlined" aria-hidden="true">
                school
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="font-headline-md text-headline-md text-on-background">
                Asistan Modülü
              </h2>
              <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">
                Asistan panelinden size atanan akademik görevleri ve yetkilendirildiğiniz işlemleri
                yönetebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="flex min-h-48 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest">
          <Loading label="Akademik görev özetiniz yükleniyor..." />
        </section>
      ) : error || !summary ? (
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-8 text-center">
          <p className="font-body-md text-body-md text-error" role="alert">
            {error ?? ASSISTANT_DASHBOARD_MESSAGES.LOAD_ERROR}
          </p>
        </section>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    menu_book
                  </span>
                </div>
                <div>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {ASSISTANT_DASHBOARD_MESSAGES.COURSES_STAT}
                  </p>
                  <p className="mt-1 font-headline-lg text-headline-lg text-on-background">
                    {summary.assignedCourseCount}
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    groups
                  </span>
                </div>
                <div>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {ASSISTANT_DASHBOARD_MESSAGES.ACADEMICIANS_STAT}
                  </p>
                  <p className="mt-1 font-headline-lg text-headline-lg text-on-background">
                    {summary.relatedAcademicianCount}
                  </p>
                </div>
              </div>
            </article>
          </section>

          <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
            <div className="flex flex-col gap-3 border-b border-outline-variant px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-headline-md text-headline-md text-on-background">
                {ASSISTANT_DASHBOARD_MESSAGES.PREVIEW_TITLE}
              </h2>
              <Link
                to={ROUTES.ASSISTANT_COURSES}
                className="inline-flex items-center gap-1 self-start font-label-md text-label-md text-primary hover:underline sm:self-auto"
              >
                {ASSISTANT_DASHBOARD_MESSAGES.VIEW_ALL}
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
            </div>

            {summary.assignedCoursesPreview.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <span
                  className="material-symbols-outlined text-[40px] text-on-surface-variant/50"
                  aria-hidden="true"
                >
                  menu_book
                </span>
                <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
                  {ASSISTANT_DASHBOARD_MESSAGES.EMPTY}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container/40">
                      <th className="px-5 py-3 text-left font-label-md text-label-md font-semibold text-on-surface-variant">
                        Ders Kodu
                      </th>
                      <th className="px-5 py-3 text-left font-label-md text-label-md font-semibold text-on-surface-variant">
                        Ders Adı
                      </th>
                      <th className="px-5 py-3 text-left font-label-md text-label-md font-semibold text-on-surface-variant">
                        Dönem
                      </th>
                      <th className="px-5 py-3 text-left font-label-md text-label-md font-semibold text-on-surface-variant">
                        Sorumlu Akademisyen
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.assignedCoursesPreview.map((course) => (
                      <tr
                        key={course.courseId}
                        className="border-b border-outline-variant/40"
                      >
                        <td className="px-5 py-3 font-label-md text-label-md font-semibold text-on-background">
                          {course.courseCode}
                        </td>
                        <td className="px-5 py-3 font-body-md text-body-md text-on-background">
                          {course.courseName}
                        </td>
                        <td className="px-5 py-3 font-body-md text-body-md text-on-background">
                          {course.academicTerm}
                        </td>
                        <td className="px-5 py-3 font-body-md text-body-md text-on-background">
                          {course.ownerAcademicianName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
