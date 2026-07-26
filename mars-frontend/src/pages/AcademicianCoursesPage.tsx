import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import AdminActionButton from '../components/AdminActionButton';
import ConfirmModal from '../components/ConfirmModal';
import CourseCreateModal from '../components/CourseCreateModal';
import CourseEditModal from '../components/CourseEditModal';
import CourseStatusBadge from '../components/CourseStatusBadge';
import Loading from '../components/Loading';
import { FORM_FIELD_CLASS, FORM_SELECT_CLASS } from '../constants';
import {
  COURSE_MESSAGES,
  COURSE_SORT_FIELD,
  COURSE_STATUS_FILTER,
  type CourseSortField,
} from '../constants/course';
import { academicianCourseDetailPath } from '../constants/routes';
import { useToast } from '../hooks/useToast';
import { changeCourseStatus, getMyCourses } from '../services/courseService';
import type { Course, CourseStatusFilter } from '../types/course';

type SortDirection = 'asc' | 'desc';

function compareCourses(a: Course, b: Course, field: CourseSortField, direction: SortDirection): number {
  const factor = direction === 'asc' ? 1 : -1;
  if (field === COURSE_SORT_FIELD.STATUS) {
    const left = a.isActive ? 1 : 0;
    const right = b.isActive ? 1 : 0;
    return (left - right) * factor;
  }
  const left = String(a[field] ?? '').toLocaleLowerCase('tr-TR');
  const right = String(b[field] ?? '').toLocaleLowerCase('tr-TR');
  return left.localeCompare(right, 'tr-TR') * factor;
}

function SortableHeader({
  label,
  field,
  activeField,
  direction,
  onSort,
  align = 'left',
}: {
  label: string;
  field: CourseSortField;
  activeField: CourseSortField;
  direction: SortDirection;
  onSort: (field: CourseSortField) => void;
  align?: 'left' | 'center' | 'right';
}) {
  const isActive = activeField === field;
  const alignClass =
    align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';

  return (
    <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold">
      <button
        type="button"
        className={`inline-flex w-full items-center gap-1 ${alignClass} border-0 bg-transparent p-0 m-0 shadow-none appearance-none cursor-pointer font-inherit text-inherit hover:text-on-background transition-colors focus:outline-none focus-visible:text-on-background`}
        onClick={() => onSort(field)}
        aria-label={`${label} sütununa göre sırala`}
      >
        <span className={isActive ? 'text-on-background' : undefined}>{label}</span>
        <span
          className={`material-symbols-outlined text-[16px] leading-none ${
            isActive ? 'text-on-background' : 'text-on-surface-variant/50'
          }`}
          aria-hidden="true"
        >
          {isActive ? (direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
        </span>
      </button>
    </th>
  );
}

export default function AcademicianCoursesPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CourseStatusFilter>(COURSE_STATUS_FILTER.ACTIVE);
  const [termFilter, setTermFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [sortField, setSortField] = useState<CourseSortField>(COURSE_SORT_FIELD.COURSE_NAME);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
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
        setError(COURSE_MESSAGES.ACCESS_DENIED);
        toast.error(COURSE_MESSAGES.ACCESS_DENIED);
      } else {
        setError(COURSE_MESSAGES.LOAD_ERROR);
        toast.error(COURSE_MESSAGES.LOAD_ERROR);
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const termOptions = useMemo(() => {
    return Array.from(new Set(courses.map((course) => course.academicTerm).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'tr-TR'),
    );
  }, [courses]);

  const departmentOptions = useMemo(() => {
    const map = new Map<number, string>();
    courses.forEach((course) => {
      map.set(course.departmentId, course.departmentName);
    });
    return Array.from(map.entries())
      .map(([departmentId, departmentName]) => ({ departmentId, departmentName }))
      .sort((a, b) => a.departmentName.localeCompare(b.departmentName, 'tr-TR'));
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('tr-TR');
    const filtered = courses.filter((course) => {
      if (statusFilter === COURSE_STATUS_FILTER.ACTIVE && !course.isActive) {
        return false;
      }
      if (statusFilter === COURSE_STATUS_FILTER.INACTIVE && course.isActive) {
        return false;
      }
      if (termFilter && course.academicTerm !== termFilter) {
        return false;
      }
      if (departmentFilter && String(course.departmentId) !== departmentFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      const code = course.courseCode.toLocaleLowerCase('tr-TR');
      const name = course.courseName.toLocaleLowerCase('tr-TR');
      return code.includes(query) || name.includes(query);
    });

    return [...filtered].sort((a, b) => compareCourses(a, b, sortField, sortDirection));
  }, [courses, searchQuery, statusFilter, termFilter, departmentFilter, sortField, sortDirection]);

  const handleSort = (field: CourseSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDirection('asc');
  };

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
      toast.success(wasActive ? COURSE_MESSAGES.DEACTIVATE_SUCCESS : COURSE_MESSAGES.ACTIVATE_SUCCESS);
      await loadCourses();
    } catch (err) {
      let message = wasActive
        ? 'Ders devre dışı bırakılamadı. Lütfen tekrar deneyin.'
        : 'Ders etkinleştirilemedi. Lütfen tekrar deneyin.';
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

  const openCreateModal = () => setCreateModalOpen(true);

  return (
    <div className="admin-page animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-background">Derslerim</h1>
        
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex flex-col gap-3">
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
              className="bg-[#0b1641] text-white px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-[#152a5c] transition-colors flex items-center gap-2"
              onClick={openCreateModal}
            >
              <span className="material-symbols-outlined text-[18px] leading-none">add</span>
              Yeni Ders
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
            <select
              id="course-status-filter"
              aria-label="Ders durumu filtresi"
              className={FORM_SELECT_CLASS}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as CourseStatusFilter)}
            >
              <option value={COURSE_STATUS_FILTER.ACTIVE}>Durum: Aktif</option>
              <option value={COURSE_STATUS_FILTER.INACTIVE}>Durum: Pasif</option>
              <option value={COURSE_STATUS_FILTER.ALL}>Durum: Tümü</option>
            </select>

            <select
              id="course-term-filter"
              aria-label="Akademik dönem filtresi"
              className={FORM_SELECT_CLASS}
              value={termFilter}
              onChange={(event) => setTermFilter(event.target.value)}
            >
              <option value="">Akademik Dönem: Tümü</option>
              {termOptions.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>

            <select
              id="course-department-filter"
              aria-label="Bölüm filtresi"
              className={FORM_SELECT_CLASS}
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
            >
              <option value="">Bölüm: Tümü</option>
              {departmentOptions.map((department) => (
                <option key={department.departmentId} value={String(department.departmentId)}>
                  {department.departmentName}
                </option>
              ))}
            </select>

            <div className="relative">
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

        <div className="overflow-x-auto max-w-full">
          {loading ? (
            <Loading label="Dersler yükleniyor..." />
          ) : error ? (
            <p className="p-6 font-body-md text-error" role="alert">
              {error}
            </p>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
                  menu_book
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                {COURSE_MESSAGES.EMPTY_TITLE}
              </p>
              <button
                type="button"
                className="bg-[#0b1641] text-white px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-[#152a5c] transition-colors flex items-center gap-2"
                onClick={openCreateModal}
              >
                <span className="material-symbols-outlined text-[18px] leading-none">add</span>
                Yeni Ders Oluştur
              </button>
            </div>
          ) : filteredCourses.length === 0 ? (
            <p className="p-6 font-body-md text-on-surface-variant">{COURSE_MESSAGES.EMPTY_FILTER}</p>
          ) : (
            <table className="w-full min-w-[720px] text-left border-collapse">
              <thead>
                <tr className="bg-surface-tint/5 border-b border-outline-variant">
                  <SortableHeader
                    label="Ders Kodu"
                    field={COURSE_SORT_FIELD.COURSE_CODE}
                    activeField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Ders Adı"
                    field={COURSE_SORT_FIELD.COURSE_NAME}
                    activeField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Akademik Dönem"
                    field={COURSE_SORT_FIELD.ACADEMIC_TERM}
                    activeField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <th className="font-label-md text-label-md text-on-surface-variant py-4 px-6 font-semibold">
                    Bölüm
                  </th>
                  <SortableHeader
                    label="Durum"
                    field={COURSE_SORT_FIELD.STATUS}
                    activeField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                    align="center"
                  />
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
                        className={`py-4 px-6 font-body-md text-body-md text-on-background font-medium whitespace-nowrap ${
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
                        className={`py-4 px-6 font-body-md text-body-md text-on-surface whitespace-nowrap ${
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
                        <CourseStatusBadge isActive={course.isActive} />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap justify-end gap-2">
                          <AdminActionButton
                            variant="neutral"
                            icon="info"
                            onClick={() => navigate(academicianCourseDetailPath(course.courseId))}
                          >
                            Detay
                          </AdminActionButton>
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
                            {course.isActive ? 'Devre Dışı Bırak' : 'Etkinleştir'}
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
        title={statusTarget?.isActive ? 'Dersi Devre Dışı Bırak' : 'Dersi Etkinleştir'}
        description={
          statusTarget?.isActive
            ? 'Bu dersi devre dışı bırakmak istediğinize emin misiniz?'
            : 'Bu dersi etkinleştirmek istediğinize emin misiniz?'
        }
        confirmLabel={statusTarget?.isActive ? 'Devre Dışı Bırak' : 'Etkinleştir'}
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
