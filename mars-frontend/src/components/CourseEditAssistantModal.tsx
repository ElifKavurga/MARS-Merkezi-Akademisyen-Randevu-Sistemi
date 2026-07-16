import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import Loading from './Loading';
import ModalFormFooter from './ModalFormFooter';
import ModalHeader from './ModalHeader';
import ModalShell from './ModalShell';
import { COURSE_MESSAGES } from '../constants/course';
import { FORM_SELECT_CLASS } from '../constants/ui';
import { updateCourseAssignment } from '../services/courseService';
import { getActiveAssistants } from '../services/userService';
import type { AssistantUserOption, CourseAssistant } from '../types/course';

type CourseEditAssistantModalProps = {
  open: boolean;
  assignment: CourseAssistant | null;
  onClose: () => void;
  onUpdated: (message: string) => void;
};

export default function CourseEditAssistantModal({
  open,
  assignment,
  onClose,
  onUpdated,
}: CourseEditAssistantModalProps) {
  const [assistants, setAssistants] = useState<AssistantUserOption[]>([]);
  const [assistantId, setAssistantId] = useState<number>(0);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || assignment == null) {
      return;
    }

    let cancelled = false;
    setAssistantId(assignment.assistantId);
    setError(null);
    setLoadingOptions(true);

    void (async () => {
      try {
        const data = await getActiveAssistants();
        if (!cancelled) {
          setAssistants(data);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        let message = 'Asistan listesi yüklenemedi.';
        if (isAxiosError(err)) {
          const backendMessage = err.response?.data?.message;
          if (typeof backendMessage === 'string' && backendMessage.length > 0) {
            message = backendMessage;
          }
        }
        setError(message);
        setAssistants([]);
      } finally {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, assignment]);

  if (!open || assignment == null) {
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
    if (submitting) {
      return;
    }

    setError(null);

    if (!assistantId) {
      setError('Asistan seçimi zorunludur.');
      return;
    }

    setSubmitting(true);
    try {
      await updateCourseAssignment(assignment.assignmentId, { assistantId });
      onUpdated(COURSE_MESSAGES.ASSIGNMENT_UPDATE_SUCCESS);
      onClose();
    } catch (err) {
      if (isAxiosError(err)) {
        const backendMessage = err.response?.data?.message;
        if (typeof backendMessage === 'string' && backendMessage.length > 0) {
          setError(backendMessage);
        } else if (err.response?.status === 409) {
          setError('Bu asistan bu derse zaten atanmış.');
        } else if (err.response?.status === 404) {
          setError('Atama bulunamadı.');
        } else if (err.response?.status === 403) {
          setError('Yetkiniz bulunmamaktadır.');
        } else {
          setError(COURSE_MESSAGES.ASSIGNMENT_UPDATE_ERROR);
        }
      } else {
        setError(COURSE_MESSAGES.ASSIGNMENT_UPDATE_ERROR);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      open={open}
      titleId="course-edit-assistant-modal-title"
      onClose={handleClose}
      onSubmit={(event) => void handleSubmit(event)}
      disableBackdropClose={submitting}
      zIndexClass="z-[60]"
      footer={<ModalFormFooter submitting={submitting} onCancel={handleClose} submitLabel="Kaydet" />}
    >
      <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
        <ModalHeader
          titleId="course-edit-assistant-modal-title"
          icon="edit"
          title="Asistanı Düzenle"
          description="Derse atanmış asistanı değiştirin."
        />

        <div className="mt-4 space-y-1.5 text-left">
          <label
            htmlFor="edit-assistantId"
            className="block font-label-md text-label-md text-on-surface-variant"
          >
            Asistan
          </label>
          {loadingOptions ? (
            <Loading variant="inline" label="Asistanlar yükleniyor..." />
          ) : (
            <select
              id="edit-assistantId"
              className={FORM_SELECT_CLASS}
              required
              disabled={submitting || assistants.length === 0}
              value={assistantId || ''}
              onChange={(event) => setAssistantId(Number(event.target.value))}
              aria-label="Asistan"
            >
              <option value="">Asistan seçin</option>
              {assistants.map((option) => (
                <option key={option.userId} value={option.userId}>
                  {option.fullName} — {option.institutionalEmail} — {option.departmentName}
                </option>
              ))}
            </select>
          )}
        </div>

        {error ? (
          <p className="mt-3 font-label-sm text-label-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </ModalShell>
  );
}
