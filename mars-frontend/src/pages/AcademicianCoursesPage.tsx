import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import Loading from '../components/Loading';
import { FORM_FIELD_CLASS } from '../constants';
import { useToast } from '../hooks/useToast';
import { getMyCourses } from '../services/courseService';
import type { Course } from '../types/course';

export default function AcademicianCoursesPage() {
  const toast = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyCourses();
      setCourses(data);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 403) {
        const message = 'Bu sayfaya erişim yetkiniz yok.';
        setError(message);
        toast.error(message);
      } else {
        const message = 'Ders listesi yüklenemedi. Lütfen tekrar deneyin.';
        setError(message);
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('tr-TR');
    if (!query) {
      return courses;
    }
    return courses.filter((course) => {
      const code = course.courseCode.toLocaleLowerCase('tr-TR');
      const name = course.courseName.toLocaleLowerCase('tr-TR');
      return code.includes(query) || name.includes(query);
    });
  }, [courses, searchQuery]);

  return (
    <div className="admin-page animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-background">Derslerim</h1>
        <p className="mt-2 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
          Sorumlu olduğunuz dersleri görüntüleyin.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                menu_book
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant text-sm">
              Size atanmış dersler
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <span
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center material-symbols-outlined text-on-surface-variant text-[20px] leading-none"
              aria-hidden="true"
            >
              search
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Ders kodu veya adı ara..."
              aria-label="Ders ara"
              className={`${FORM_FIELD_CLASS} pl-10`}
            />
          </div>
        </div>

        <div className="admin-table-wrap">
          {loading ? (
            <Loading label="Dersler yükleniyor..." />
          ) : error ? (
            <p className="p-6 font-body-md text-error" role="alert">
              {error}
            </p>
          ) : courses.length === 0 ? (
            <p className="p-6 font-body-md text-on-surface-variant">Kayıtlı ders bulunamadı.</p>
          ) : filteredCourses.length === 0 ? (
            <p className="p-6 font-body-md text-on-surface-variant">Arama kriterine uygun ders bulunamadı.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-tint/5 border-b border-outline-variant">
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold">
                    Ders Kodu
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold">
                    Ders Adı
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold">
                    Akademik Dönem
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold">
                    Bölüm
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {filteredCourses.map((course) => (
                  <tr
                    key={course.courseId}
                    className="hover:bg-surface-container-low transition-colors"
                  >
                    <td className="py-4 px-6 font-body-md text-body-md text-on-background font-medium">
                      {course.courseCode}
                    </td>
                    <td className="py-4 px-6 font-body-md text-body-md text-on-surface">
                      {course.courseName}
                    </td>
                    <td className="py-4 px-6 font-body-md text-body-md text-on-surface">
                      {course.academicTerm}
                    </td>
                    <td className="py-4 px-6 font-body-md text-body-md text-on-surface">
                      {course.departmentName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
