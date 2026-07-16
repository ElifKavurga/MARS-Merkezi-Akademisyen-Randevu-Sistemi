import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import AdminActionButton from '../components/AdminActionButton';
import ConfirmModal from '../components/ConfirmModal';
import CourseAssignAssistantModal from '../components/CourseAssignAssistantModal';
import CourseEditAssistantModal from '../components/CourseEditAssistantModal';
import Loading from '../components/Loading';
import { COURSE_MESSAGES } from '../constants/course';
import { ROUTES } from '../constants/routes';
import { useToast } from '../hooks/useToast';
import {
  getCourseAssistants,
  getMyCourse,
  removeCourseAssignment,
} from '../services/courseService';
import type { CourseAssistant, CourseDetail } from '../types/course';
import { formatDateTime } from '../utils';

const COMING_SOON_SECTIONS = [
  COURSE_MESSAGES.SECTION_OFFICE_HOURS,
  COURSE_MESSAGES.SECTION_APPOINTMENTS,
  COURSE_MESSAGES.SECTION_DELEGATION,
] as const;

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4 border-b border-outline-variant/40 py-3 last:border-b-0">
      <span className="font-label-md text-label-md text-on-surface-variant shrink-0">{label}</span>
      <div className="font-body-md text-body-md text-on-background sm:text-right break-words">{children}</div>
    </div>
  );
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
      <div className="p-4 border-b border-outline-variant flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-label-md text-label-md text-on-background">{title}</h2>
        {action}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

export default function CourseDetailPage() {
  const { courseId: courseIdParam } = useParams<{ courseId: string }>();
  const courseId = Number(courseIdParam);
  const navigate = useNavigate();
  const toast = useToast();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [assistants, setAssistants] = useState<CourseAssistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CourseAssistant | null>(null);
  const [removeTarget, setRemoveTarget] = useState<CourseAssistant | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const refreshAssistants = useCallback(async (id: number) => {
    const assistantData = await getCourseAssistants(id);
    setAssistants(assistantData);
  }, []);

  const loadPage = useCallback(async (id: number) => {
    const [courseData, assistantData] = await Promise.all([
      getMyCourse(id),
      getCourseAssistants(id),
    ]);
    setCourse(courseData);
    setAssistants(assistantData);
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
            message = 'Ders bulunamadı.';
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
        await refreshAssistants(courseId);
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
      await refreshAssistants(courseId);
    } catch (err) {
      let message: string = COURSE_MESSAGES.ASSIGNMENT_REMOVE_ERROR;
      if (isAxiosError(err)) {
        const backendMessage = err.response?.data?.message;
        if (typeof backendMessage === 'string' && backendMessage.length > 0) {
          message = backendMessage;
        } else if (err.response?.status === 403) {
          message = 'Yetkiniz bulunmamaktadır.';
        } else if (err.response?.status === 404) {
          message = 'Atama bulunamadı.';
        }
      }
      setRemoveError(message);
      toast.error(message);
    } finally {
      setRemoveLoading(false);
    }
  };

  return (
    <div className="admin-page animate-fade-in space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-background">
            {course?.courseName ?? COURSE_MESSAGES.PAGE_TITLE_FALLBACK}
          </h1>
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
          Derslerime Dön
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
      ) : course ? (
        <>
          <SectionCard title={COURSE_MESSAGES.SECTION_GENERAL}>
            <DetailField label="Ders Kodu">{course.courseCode}</DetailField>
            <DetailField label="Ders Adı">{course.courseName}</DetailField>
            <DetailField label="Akademik Dönem">{course.academicTerm}</DetailField>
            <DetailField label="Bölüm">{course.departmentName}</DetailField>
            <DetailField label="Durum">
              <span
                className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 font-label-sm text-label-sm ${
                  course.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {course.isActive ? 'Aktif' : 'Pasif'}
              </span>
            </DetailField>
            <DetailField label="Oluşturulma Tarihi">{formatDateTime(course.createdAt)}</DetailField>
            <DetailField label="Son Güncellenme Tarihi">{formatDateTime(course.updatedAt)}</DetailField>
          </SectionCard>

          <SectionCard
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
              <p className="font-body-md text-body-md text-on-surface-variant">
                {COURSE_MESSAGES.ASSISTANTS_EMPTY}
              </p>
            ) : (
              <ul className="divide-y divide-outline-variant/40">
                {assistants.map((assistant) => (
                  <li
                    key={assistant.assignmentId}
                    className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-body-md text-body-md text-on-background">
                        {assistant.assistantName}
                      </p>
                      <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
                        {assistant.institutionalEmail}
                      </p>
                      <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
                        {assistant.departmentName}
                      </p>
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
          </SectionCard>

          {COMING_SOON_SECTIONS.map((title) => (
            <SectionCard key={title} title={title}>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {COURSE_MESSAGES.COMING_SOON}
              </p>
            </SectionCard>
          ))}
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
        title="Asistan Atamasını Kaldır"
        description="Bu asistanı dersten kaldırmak istediğinize emin misiniz?"
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
