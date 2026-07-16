import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import AdminActionButton from '../components/AdminActionButton';
import ConfirmModal from '../components/ConfirmModal';
import CourseAssignAssistantModal from '../components/CourseAssignAssistantModal';
import CourseDetailBreadcrumb from '../components/CourseDetailBreadcrumb';
import CourseDetailField from '../components/CourseDetailField';
import CourseEditAssistantModal from '../components/CourseEditAssistantModal';
import CourseSectionCard from '../components/CourseSectionCard';
import CourseStatCard from '../components/CourseStatCard';
import CourseStatusBadge from '../components/CourseStatusBadge';
import Loading from '../components/Loading';
import { COURSE_COMING_SOON_MODULES, COURSE_MESSAGES } from '../constants/course';
import { ROUTES } from '../constants/routes';
import { useToast } from '../hooks/useToast';
import {
  getCourseAssistants,
  getCourseStats,
  getMyCourse,
  removeCourseAssignment,
} from '../services/courseService';
import type { CourseAssistant, CourseDetail, CourseStats } from '../types/course';
import { formatDateTime } from '../utils';

export default function CourseDetailPage() {
  const { courseId: courseIdParam } = useParams<{ courseId: string }>();
  const courseId = Number(courseIdParam);
  const navigate = useNavigate();
  const toast = useToast();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [assistants, setAssistants] = useState<CourseAssistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CourseAssistant | null>(null);
  const [removeTarget, setRemoveTarget] = useState<CourseAssistant | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const refreshAssistantsAndStats = useCallback(async (id: number) => {
    const [assistantData, statsData] = await Promise.all([
      getCourseAssistants(id),
      getCourseStats(id),
    ]);
    setAssistants(assistantData);
    setStats(statsData);
  }, []);

  const loadPage = useCallback(async (id: number) => {
    const [courseData, assistantData, statsData] = await Promise.all([
      getMyCourse(id),
      getCourseAssistants(id),
      getCourseStats(id),
    ]);
    setCourse(courseData);
    setAssistants(assistantData);
    setStats(statsData);
  }, []);

  useEffect(() => {
    if (!Number.isFinite(courseId) || courseId <= 0) {
      setError(COURSE_MESSAGES.DETAIL_ERROR);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setCourse(null);
    setStats(null);
    setAssistants([]);

    void (async () => {
      try {
        await loadPage(courseId);
      } catch (err) {
        if (cancelled) {
          return;
        }
        let message: string = COURSE_MESSAGES.DETAIL_ERROR;
        if (isAxiosError(err)) {
          const backendMessage = err.response?.data?.message;
          if (typeof backendMessage === 'string' && backendMessage.length > 0) {
            message = backendMessage;
          } else if (err.response?.status === 403) {
            message = COURSE_MESSAGES.ACCESS_DENIED;
          } else if (err.response?.status === 404) {
            message = COURSE_MESSAGES.NOT_FOUND;
          }
        }
        setError(message);
        toast.error(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId, loadPage, toast]);

  const handleAssistantsChanged = (message: string) => {
    toast.success(message);
    void (async () => {
      try {
        await refreshAssistantsAndStats(courseId);
      } catch {
        toast.error(COURSE_MESSAGES.ASSISTANTS_ERROR);
      }
    })();
  };

  const handleConfirmRemove = async () => {
    if (removeTarget == null || removeLoading) {
      return;
    }

    setRemoveLoading(true);
    setRemoveError(null);
    try {
      await removeCourseAssignment(removeTarget.assignmentId);
      setRemoveTarget(null);
      toast.success(COURSE_MESSAGES.ASSIGNMENT_REMOVE_SUCCESS);
      await refreshAssistantsAndStats(courseId);
    } catch (err) {
      let message: string = COURSE_MESSAGES.ASSIGNMENT_REMOVE_ERROR;
      if (isAxiosError(err)) {
        const backendMessage = err.response?.data?.message;
        if (typeof backendMessage === 'string' && backendMessage.length > 0) {
          message = backendMessage;
        } else if (err.response?.status === 403) {
          message = COURSE_MESSAGES.FORBIDDEN;
        } else if (err.response?.status === 404) {
          message = COURSE_MESSAGES.ASSIGNMENT_NOT_FOUND;
        }
      }
      setRemoveError(message);
      toast.error(message);
    } finally {
      setRemoveLoading(false);
    }
  };

  const pageTitle = course?.courseName ?? COURSE_MESSAGES.PAGE_TITLE_FALLBACK;

  return (
    <div className="admin-page animate-fade-in space-y-6">
      <CourseDetailBreadcrumb courseName={course?.courseName} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-background">{pageTitle}</h1>
          {course ? (
            <p className="mt-2 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
              {course.courseCode} · {course.academicTerm}
            </p>
          ) : null}
        </div>
        <AdminActionButton
          variant="neutral"
          icon="arrow_back"
          onClick={() => navigate(ROUTES.ACADEMICIAN_COURSES)}
        >
          {COURSE_MESSAGES.BACK_TO_COURSES}
        </AdminActionButton>
      </div>

      {loading ? (
        <Loading label="Ders detayı yükleniyor..." />
      ) : error ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6">
          <p className="font-label-sm text-label-sm text-error" role="alert">
            {error}
          </p>
        </div>
      ) : course && stats ? (
        <>
          <section aria-labelledby="course-stats-heading" className="space-y-3">
            <h2 id="course-stats-heading" className="font-label-md text-label-md text-on-background">
              {COURSE_MESSAGES.SECTION_STATS}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <CourseStatCard
                label={COURSE_MESSAGES.STAT_ASSISTANTS}
                value={stats.totalAssistantCount}
                icon="group"
              />
              <CourseStatCard
                label={COURSE_MESSAGES.STAT_STATUS}
                value={stats.isActive ? 'Aktif' : 'Pasif'}
                icon="flag"
              />
              <CourseStatCard
                label={COURSE_MESSAGES.STAT_TERM}
                value={stats.academicTerm}
                icon="calendar_month"
              />
              <CourseStatCard
                label={COURSE_MESSAGES.STAT_DEPARTMENT}
                value={stats.departmentName}
                icon="apartment"
              />
            </div>
          </section>

          <CourseSectionCard title={COURSE_MESSAGES.SECTION_GENERAL}>
            <CourseDetailField label="Ders Kodu">{course.courseCode}</CourseDetailField>
            <CourseDetailField label="Ders Adı">{course.courseName}</CourseDetailField>
            <CourseDetailField label="Akademik Dönem">{course.academicTerm}</CourseDetailField>
            <CourseDetailField label="Bölüm">{course.departmentName}</CourseDetailField>
            <CourseDetailField label="Durum">
              <CourseStatusBadge isActive={course.isActive} />
            </CourseDetailField>
            <CourseDetailField label="Oluşturulma Tarihi">
              {formatDateTime(course.createdAt)}
            </CourseDetailField>
            <CourseDetailField label="Son Güncellenme Tarihi">
              {formatDateTime(course.updatedAt)}
            </CourseDetailField>
          </CourseSectionCard>

          <CourseSectionCard
            title={COURSE_MESSAGES.SECTION_ASSISTANTS}
            action={
              course.isActive ? (
                <AdminActionButton
                  variant="primary"
                  icon="person_add"
                  onClick={() => setAssignOpen(true)}
                >
                  Asistan Ata
                </AdminActionButton>
              ) : null
            }
          >
            {assistants.length === 0 ? (
              <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container/30 px-4 py-8 text-center">
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {COURSE_MESSAGES.ASSISTANTS_EMPTY}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-outline-variant/40">
                {assistants.map((assistant) => (
                  <li
                    key={assistant.assignmentId}
                    className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                      <div>
                        <p className="font-body-md text-body-md text-on-background">
                          {assistant.assistantName}
                        </p>
                        <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant break-all">
                          {assistant.institutionalEmail}
                        </p>
                      </div>
                      <div>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                          {assistant.departmentName}
                        </p>
                        <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
                          Atanma: {formatDateTime(assistant.assignedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row flex-wrap items-center justify-end gap-2 ml-auto shrink-0">
                      <AdminActionButton
                        variant="neutral"
                        icon="edit"
                        onClick={() => setEditTarget(assistant)}
                      >
                        Düzenle
                      </AdminActionButton>
                      <AdminActionButton
                        variant="danger"
                        icon="person_remove"
                        onClick={() => {
                          setRemoveError(null);
                          setRemoveTarget(assistant);
                        }}
                      >
                        Kaldır
                      </AdminActionButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CourseSectionCard>

          <section aria-labelledby="course-future-heading" className="space-y-3">
            <h2 id="course-future-heading" className="font-label-md text-label-md text-on-background">
              {COURSE_MESSAGES.SECTION_FUTURE}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {COURSE_COMING_SOON_MODULES.map((module) => (
                <CourseSectionCard
                  key={module.title}
                  title={module.title}
                  action={
                    <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">
                      {module.icon}
                    </span>
                  }
                >
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {COURSE_MESSAGES.COMING_SOON}
                  </p>
                </CourseSectionCard>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {Number.isFinite(courseId) && courseId > 0 ? (
        <CourseAssignAssistantModal
          open={assignOpen}
          courseId={courseId}
          onClose={() => setAssignOpen(false)}
          onAssigned={handleAssistantsChanged}
        />
      ) : null}

      <CourseEditAssistantModal
        open={editTarget != null}
        assignment={editTarget}
        onClose={() => setEditTarget(null)}
        onUpdated={handleAssistantsChanged}
      />

      <ConfirmModal
        open={removeTarget != null}
        title={COURSE_MESSAGES.ASSIGNMENT_REMOVE_TITLE}
        description={COURSE_MESSAGES.ASSIGNMENT_REMOVE_DESCRIPTION}
        confirmLabel="Kaldır"
        cancelLabel="İptal"
        loading={removeLoading}
        error={removeError}
        variant="danger"
        onConfirm={() => void handleConfirmRemove()}
        onClose={() => {
          if (removeLoading) {
            return;
          }
          setRemoveTarget(null);
          setRemoveError(null);
        }}
      />
    </div>
  );
}
