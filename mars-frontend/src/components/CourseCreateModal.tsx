import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import DepartmentSelect from './DepartmentSelect';
import ModalFormFooter from './ModalFormFooter';
import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';
import { FORM_FIELD_CLASS, FORM_SELECT_CLASS } from '../constants/ui';
import { createCourse } from '../services/courseService';
import type { CourseCreatePayload } from '../types/course';
import { getAcademicTermOptions } from '../utils';


type CourseCreateModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (message: string) => void;
};

const INITIAL_FORM: CourseCreatePayload = {
  courseCode: '',
  courseName: '',
  academicTerm: '',
  departmentId: 0,
};

export default function CourseCreateModal({ open, onClose, onCreated }: CourseCreateModalProps) {
  const [form, setForm] = useState<CourseCreatePayload>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const academicTermOptions = useMemo(() => getAcademicTermOptions(), []);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm({ ...INITIAL_FORM });
    setError(null);
  }, [open]);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (submitting) {
      return;
    }
    setForm({ ...INITIAL_FORM });
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
      await createCourse({
        courseCode,
        courseName,
        academicTerm,
        departmentId: Number(form.departmentId),
      });
      setForm({ ...INITIAL_FORM });
      onCreated('Ders başarıyla oluşturuldu.');
      onClose();
    } catch (err) {
      if (isAxiosError(err)) {
        const backendMessage = err.response?.data?.message;
        if (typeof backendMessage === 'string' && backendMessage.length > 0) {
          setError(backendMessage);
        } else if (err.response?.status === 409) {
          setError('Bu ders kodu ile zaten bir ders kayıtlı.');
        } else {
          setError('Ders oluşturulamadı. Lütfen tekrar deneyin.');
        }
      } else {
        setError('Ders oluşturulamadı. Lütfen tekrar deneyin.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      open={open}
      titleId="course-create-modal-title"
      onClose={handleClose}
      onSubmit={handleSubmit}
      disableBackdropClose={submitting}
      footer={<ModalFormFooter submitting={submitting} onCancel={handleClose} submitLabel="Kaydet" />}
    >
      <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
        <ModalHeader
          titleId="course-create-modal-title"
          icon="menu_book"
          title="Yeni Ders"
          description="Sorumlu olduğunuz yeni bir ders tanımlayın."
        />

        <div className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label
              className="block font-label-md text-label-md text-on-surface-variant"
              htmlFor="course-code"
            >
              Ders Kodu
            </label>
            <input
              id="course-code"
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
              htmlFor="course-name"
            >
              Ders Adı
            </label>
            <input
              id="course-name"
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
              htmlFor="course-term"
            >
              Akademik Dönem
            </label>
            <select
              id="course-term"
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
              htmlFor="course-department"
            >
              Bölüm
            </label>
            <DepartmentSelect
              id="course-department"
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
