import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import DepartmentSelect from './DepartmentSelect';
import ModalFormFooter from './ModalFormFooter';
import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';
import { FORM_FIELD_CLASS, FORM_SELECT_CLASS } from '../constants/ui';
import { updateCourse } from '../services/courseService';
import type { Course, CourseUpdatePayload } from '../types/course';
import { getAcademicTermOptions } from '../utils';

type CourseEditModalProps = {
  open: boolean;
  course: Course | null;
  onClose: () => void;
  onUpdated: (message: string) => void;
};

export default function CourseEditModal({ open, course, onClose, onUpdated }: CourseEditModalProps) {
  const [form, setForm] = useState<CourseUpdatePayload>({
    courseCode: '',
    courseName: '',
    academicTerm: '',
    departmentId: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const academicTermOptions = useMemo(() => {
    const options = getAcademicTermOptions();
    if (course?.academicTerm && !options.includes(course.academicTerm)) {
      return [course.academicTerm, ...options];
    }
    return options;
  }, [course]);

  useEffect(() => {
    if (!open || !course) {
      return;
    }
    setForm({
      courseCode: course.courseCode,
      courseName: course.courseName,
      academicTerm: course.academicTerm,
      departmentId: course.departmentId,
    });
    setError(null);
  }, [open, course]);

  if (!open || !course) {
    return null;
  }

  const handleClose = () => {
    if (submitting) {
      return;
    }
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const courseCode = form.courseCode.trim();
    const courseName = form.courseName.trim();
    const academicTerm = form.academicTerm.trim();

    if (!courseCode) {
      setError('Ders kodu zorunludur.');
      return;
    }
    if (!courseName) {
      setError('Ders adı zorunludur.');
      return;
    }
    if (!academicTerm) {
      setError('Akademik dönem zorunludur.');
      return;
    }
    if (!form.departmentId) {
      setError('Bölüm seçimi zorunludur.');
      return;
    }

    setSubmitting(true);

    try {
      await updateCourse(course.courseId, {
        courseCode,
        courseName,
        academicTerm,
        departmentId: Number(form.departmentId),
      });
      onUpdated('Ders başarıyla güncellendi.');
      onClose();
    } catch (err) {
      if (isAxiosError(err)) {
        const backendMessage = err.response?.data?.message;
        if (typeof backendMessage === 'string' && backendMessage.length > 0) {
          setError(backendMessage);
        } else if (err.response?.status === 409) {
          setError('Bu ders kodu ile zaten bir ders kayıtlı.');
        } else if (err.response?.status === 403) {
          setError('Bu dersi güncelleme yetkiniz yok.');
        } else {
          setError('Ders güncellenemedi. Lütfen tekrar deneyin.');
        }
      } else {
        setError('Ders güncellenemedi. Lütfen tekrar deneyin.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      open={open}
      titleId="course-edit-modal-title"
      onClose={handleClose}
      onSubmit={handleSubmit}
      disableBackdropClose={submitting}
      footer={<ModalFormFooter submitting={submitting} onCancel={handleClose} submitLabel="Kaydet" />}
    >
      <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
        <ModalHeader
          titleId="course-edit-modal-title"
          icon="edit"
          title="Ders Düzenle"
          description="Ders bilgilerini güncelleyin."
        />

        <div className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label
              className="block font-label-md text-label-md text-on-surface-variant"
              htmlFor="edit-course-code"
            >
              Ders Kodu
            </label>
            <input
              id="edit-course-code"
              className={FORM_FIELD_CLASS}
              required
              value={form.courseCode}
              onChange={(event) => setForm((prev) => ({ ...prev, courseCode: event.target.value }))}
              disabled={submitting}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="block font-label-md text-label-md text-on-surface-variant"
              htmlFor="edit-course-name"
            >
              Ders Adı
            </label>
            <input
              id="edit-course-name"
              className={FORM_FIELD_CLASS}
              required
              value={form.courseName}
              onChange={(event) => setForm((prev) => ({ ...prev, courseName: event.target.value }))}
              disabled={submitting}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="block font-label-md text-label-md text-on-surface-variant"
              htmlFor="edit-course-term"
            >
              Akademik Dönem
            </label>
            <select
              id="edit-course-term"
              className={FORM_SELECT_CLASS}
              required
              value={form.academicTerm}
              onChange={(event) => setForm((prev) => ({ ...prev, academicTerm: event.target.value }))}
              disabled={submitting}
              aria-label="Akademik dönem"
            >
              <option value="">Akademik Dönem Seçiniz</option>
              {academicTermOptions.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              className="block font-label-md text-label-md text-on-surface-variant"
              htmlFor="edit-course-department"
            >
              Bölüm
            </label>
            <DepartmentSelect
              id="edit-course-department"
              value={form.departmentId}
              onChange={(departmentId) => setForm((prev) => ({ ...prev, departmentId }))}
              disabled={submitting}
              required
              allowEmpty
              emptyLabel="Bölüm seçin"
            />
          </div>

          {error ? (
            <p className="font-label-sm text-label-sm text-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </ModalShell>
  );
}
