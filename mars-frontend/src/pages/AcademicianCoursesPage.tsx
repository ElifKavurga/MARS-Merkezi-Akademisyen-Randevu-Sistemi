import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import AdminActionButton from '../components/AdminActionButton';
import ConfirmModal from '../components/ConfirmModal';
import CourseCreateModal from '../components/CourseCreateModal';
import CourseEditModal from '../components/CourseEditModal';
import Loading from '../components/Loading';
import { FORM_FIELD_CLASS, FORM_SELECT_CLASS } from '../constants';
import { useToast } from '../hooks/useToast';
import { changeCourseStatus, getMyCourses } from '../services/courseService';
import type { Course, CourseStatusFilter } from '../types/course';

export default function AcademicianCoursesPage() {
  const toast = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CourseStatusFilter>('ACTIVE');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [statusTarget, setStatusTarget] = useState<Course | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

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
    return courses.filter((course) => {
      if (statusFilter === 'ACTIVE' && !course.isActive) {
        return false;
      }
      if (statusFilter === 'INACTIVE' && course.isActive) {
        return false;
      }
      if (!query) {
        return true;
      }
      const code = course.courseCode.toLocaleLowerCase('tr-TR');
      const name = course.courseName.toLocaleLowerCase('tr-TR');
      return code.includes(query) || name.includes(query);
    });
  }, [courses, searchQuery, statusFilter]);

  const handleConfirmStatusChange = async () => {
    if (!statusTarget || statusLoading) {
      return;
    }

    const wasActive = statusTarget.isActive;
    setStatusLoading(true);
    setStatusError(null);

    try {
      await changeCourseStatus(statusTarget.courseId);
      setStatusTarget(null);
      toast.success(
        wasActive ? 'Ders başarıyla pasifleştirildi.' : 'Ders başarıyla aktifleştirildi.',
      );
      await loadCourses();
    } catch (err) {
      let message = wasActive
        ? 'Ders pasifleştirilemedi. Lütfen tekrar deneyin.'
        : 'Ders aktifleştirilemedi. Lütfen tekrar deneyin.';
      if (isAxiosError(err)) {
        const backendMessage = err.response?.data?.message;
        if (typeof backendMessage === 'string' && backendMessage.length > 0) {
          message = backendMessage;
        } else if (err.response?.status === 403) {
          message = 'Bu dersin durumunu değiştirme yetkiniz yok.';
        } else if (err.response?.status === 404) {
          message = 'Ders bulunamadı.';
        }
      }
      setStatusError(message);
      toast.error(message);
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-background">Derslerim</h1>
        <p className="mt-2 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
          Sorumlu olduğunuz dersleri görüntüleyin ve durumlarını yönetin.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                menu_book
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant text-sm">
              Size atanmış dersler
            </p>
            <button
              type="button"
              className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors flex items-center gap-2"
              onClick={() => setCreateModalOpen(true)}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Yeni Ders
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              id="course-status-filter"
              aria-label="Ders durumu filtresi"
              className={`${FORM_SELECT_CLASS} w-full sm:w-40`}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as CourseStatusFilter)}
            >
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Pasif</option>
              <option value="ALL">Tümü</option>
            </select>

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
            <p className="p-6 font-body-md text-on-surface-variant">
              Seçili filtreye uygun ders bulunamadı.
            </p>
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
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold text-center">
                    Durum
                  </th>
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold text-right">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {filteredCourses.map((course) => {
                  const inactive = !course.isActive;
                  return (
                    <tr
                      key={course.courseId}
                      className={`hover:bg-surface-container-low transition-colors ${
                        inactive ? 'bg-surface-container-lowest/30' : ''
                      }`}
                    >
                      <td
                        className={`py-4 px-6 font-body-md text-body-md text-on-background font-medium ${
                          inactive ? 'opacity-60' : ''
                        }`}
                      >
                        {course.courseCode}
                      </td>
                      <td
                        className={`py-4 px-6 font-body-md text-body-md text-on-surface ${
                          inactive ? 'opacity-60' : ''
                        }`}
                      >
                        {course.courseName}
                      </td>
                      <td
                        className={`py-4 px-6 font-body-md text-body-md text-on-surface ${
                          inactive ? 'opacity-60' : ''
                        }`}
                      >
                        {course.academicTerm}
                      </td>
                      <td
                        className={`py-4 px-6 font-body-md text-body-md text-on-surface ${
                          inactive ? 'opacity-60' : ''
                        }`}
                      >
                        {course.departmentName}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 font-label-sm text-label-sm ${
                            course.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {course.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap justify-end gap-2">
                          {!inactive ? (
                            <AdminActionButton
                              variant="primary"
                              icon="edit"
                              onClick={() => setEditingCourse(course)}
                            >
                              Düzenle
                            </AdminActionButton>
                          ) : null}
                          <AdminActionButton
                            variant={course.isActive ? 'danger' : 'primary'}
                            icon={course.isActive ? 'pause_circle' : 'play_circle'}
                            onClick={() => {
                              setStatusError(null);
                              setStatusTarget(course);
                            }}
                          >
                            {course.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                          </AdminActionButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CourseCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(message) => {
          toast.success(message);
          void loadCourses();
        }}
      />

      <CourseEditModal
        open={editingCourse != null}
        course={editingCourse}
        onClose={() => setEditingCourse(null)}
        onUpdated={(message) => {
          toast.success(message);
          void loadCourses();
        }}
      />

      <ConfirmModal
        open={statusTarget != null}
        title={statusTarget?.isActive ? 'Dersi Pasifleştir' : 'Dersi Aktifleştir'}
        description={
          statusTarget?.isActive
            ? 'Bu dersi pasifleştirmek istediğinize emin misiniz?'
            : 'Bu dersi tekrar aktif hale getirmek istediğinize emin misiniz?'
        }
        confirmLabel={statusTarget?.isActive ? 'Pasifleştir' : 'Aktifleştir'}
        cancelLabel="İptal"
        loading={statusLoading}
        error={statusError}
        variant={statusTarget?.isActive ? 'danger' : 'primary'}
        onConfirm={() => void handleConfirmStatusChange()}
        onClose={() => {
          if (statusLoading) {
            return;
          }
          setStatusTarget(null);
          setStatusError(null);
        }}
      />
    </div>
  );
}
