import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import Loading from './Loading';
import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';
import { COURSE_MESSAGES } from '../constants/course';
import { getMyCourse } from '../services/courseService';
import type { Course } from '../types/course';
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
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || courseId == null) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setCourse(null);

    void (async () => {
      try {
        const data = await getMyCourse(courseId);
        if (!cancelled) {
          setCourse(data);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (isAxiosError(err)) {
          const backendMessage = err.response?.data?.message;
          if (typeof backendMessage === 'string' && backendMessage.length > 0) {
            setError(backendMessage);
          } else if (err.response?.status === 403) {
            setError('Bu dersi görüntüleme yetkiniz yok.');
          } else if (err.response?.status === 404) {
            setError('Ders bulunamadı.');
          } else {
            setError(COURSE_MESSAGES.DETAIL_ERROR);
          }
        } else {
          setError(COURSE_MESSAGES.DETAIL_ERROR);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, courseId]);

  if (!open) {
    return null;
  }

  return (
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
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
