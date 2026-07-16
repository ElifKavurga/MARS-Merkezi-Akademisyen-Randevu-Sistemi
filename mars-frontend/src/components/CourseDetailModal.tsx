import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import AdminActionButton from './AdminActionButton';
import CourseAssignAssistantModal from './CourseAssignAssistantModal';
import Loading from './Loading';
import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';
import { COURSE_MESSAGES } from '../constants/course';
import { useToast } from '../hooks/useToast';
import { getCourseAssistants, getMyCourse } from '../services/courseService';
import type { Course, CourseAssistant } from '../types/course';
import { formatDateTime } from '../utils';

type CourseDetailModalProps = {
  open: boolean;
  courseId: number | null;
  onClose: () => void;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4 border-b border-outline-variant/40 py-3 last:border-b-0">
      <span className="font-label-md text-label-md text-on-surface-variant shrink-0">{label}</span>
      <span className="font-body-md text-body-md text-on-background sm:text-right break-words">{value}</span>
    </div>
  );
}

export default function CourseDetailModal({ open, courseId, onClose }: CourseDetailModalProps) {
  const toast = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [assistants, setAssistants] = useState<CourseAssistant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

  const loadDetail = useCallback(async (id: number) => {
    const [courseData, assistantData] = await Promise.all([
      getMyCourse(id),
      getCourseAssistants(id),
    ]);
    setCourse(courseData);
    setAssistants(assistantData);
  }, []);

  useEffect(() => {
    if (!open || courseId == null) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setCourse(null);
    setAssistants([]);
    setAssignOpen(false);

    void (async () => {
      try {
        await loadDetail(courseId);
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
            message = 'Bu dersi görüntüleme yetkiniz yok.';
          } else if (err.response?.status === 404) {
            message = 'Ders bulunamadı.';
          } else {
            message = COURSE_MESSAGES.ASSISTANTS_ERROR;
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
  }, [open, courseId, toast, loadDetail]);

  if (!open) {
    return null;
  }

  return (
    <>
      <ModalShell
        open={open}
        titleId="course-detail-modal-title"
        onClose={onClose}
        footer={
          <div className="bg-surface-bright px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-outline-variant">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-lg bg-primary-container px-5 py-2 font-label-md text-label-md text-on-primary hover:bg-black sm:w-auto shadow-sm transition-colors"
              onClick={onClose}
            >
              Kapat
            </button>
          </div>
        }
      >
        <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
          <ModalHeader
            titleId="course-detail-modal-title"
            icon="info"
            title="Ders Detayı"
            description="Seçilen dersin özet bilgileri."
          />

          {loading ? (
            <Loading label="Ders detayı yükleniyor..." />
          ) : error ? (
            <p className="mt-4 font-label-sm text-label-sm text-error" role="alert">
              {error}
            </p>
          ) : course ? (
            <div className="mt-2 text-left">
              <DetailRow label="Ders Kodu" value={course.courseCode} />
              <DetailRow label="Ders Adı" value={course.courseName} />
              <DetailRow label="Akademik Dönem" value={course.academicTerm} />
              <DetailRow label="Bölüm" value={course.departmentName} />
              <DetailRow label="Durum" value={course.isActive ? 'Aktif' : 'Pasif'} />
              <DetailRow label="Oluşturulma Tarihi" value={formatDateTime(course.createdAt)} />
              <DetailRow label="Son Güncellenme Tarihi" value={formatDateTime(course.updatedAt)} />

              <div className="mt-6 border-t border-outline-variant/40 pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="font-label-md text-label-md text-on-background">Atanmış Asistanlar</h3>
                  {course.isActive ? (
                    <AdminActionButton
                      variant="primary"
                      icon="person_add"
                      onClick={() => setAssignOpen(true)}
                    >
                      Asistan Ata
                    </AdminActionButton>
                  ) : null}
                </div>
                {assistants.length === 0 ? (
                  <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
                    {COURSE_MESSAGES.ASSISTANTS_EMPTY}
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-outline-variant/40">
                    {assistants.map((assistant) => (
                      <li key={assistant.assignmentId} className="py-3">
                        <p className="font-body-md text-body-md text-on-background">{assistant.assistantName}</p>
                        <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
                          {assistant.institutionalEmail}
                        </p>
                        <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
                          {assistant.departmentName}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </ModalShell>

      {courseId != null ? (
        <CourseAssignAssistantModal
          open={assignOpen}
          courseId={courseId}
          onClose={() => setAssignOpen(false)}
          onAssigned={(message) => {
            toast.success(message);
            void (async () => {
              try {
                const assistantData = await getCourseAssistants(courseId);
                setAssistants(assistantData);
              } catch {
                toast.error(COURSE_MESSAGES.ASSISTANTS_ERROR);
              }
            })();
          }}
        />
      ) : null}
    </>
  );
}
