import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import Loading from '../components/Loading';
import { UI_LABELS } from '../constants';
import { useToast } from '../hooks/useToast';
import {
  getAdminPenaltyRule,
  updateAdminPenaltyRule,
} from '../services/adminPenaltyRuleService';
import type { UpdatePenaltyRulePayload } from '../types/penaltyRule';

const MAX_NOSHOW_OPTIONS = [1, 2, 3, 4, 5] as const;

export default function AdminPenaltyRulesPage() {
  const toast = useToast();
  const [form, setForm] = useState<UpdatePenaltyRulePayload>({
    maxNoShowCount: 3,
    banDurationDays: 7,
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPenaltyRule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminPenaltyRule();
      setForm({
        maxNoShowCount: data.maxNoShowCount,
        banDurationDays: data.banDurationDays,
        isActive: Boolean(data.isActive),
      });
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 403) {
        setError('Bu sayfaya erişim yetkiniz yok.');
      } else if (isAxiosError(err)) {
        const backendMessage = err.response?.data?.message;
        setError(
          typeof backendMessage === 'string' && backendMessage.length > 0
            ? backendMessage
            : 'Ceza kuralları yüklenemedi.',
        );
      } else {
        setError('Ceza kuralları yüklenemedi.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPenaltyRule();
  }, [loadPenaltyRule]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: UpdatePenaltyRulePayload = {
      maxNoShowCount: Number(form.maxNoShowCount),
      banDurationDays: Number(form.banDurationDays),
      isActive: Boolean(form.isActive),
    };

    try {
      const updated = await updateAdminPenaltyRule(payload);
      setForm({
        maxNoShowCount: updated.maxNoShowCount,
        banDurationDays: updated.banDurationDays,
        isActive: Boolean(updated.isActive),
      });
      toast.success('Ceza kuralları başarıyla güncellendi.');
      await loadPenaltyRule();
    } catch (err) {
      if (isAxiosError(err)) {
        const backendMessage = err.response?.data?.message;
        const message =
          typeof backendMessage === 'string' && backendMessage.length > 0
            ? backendMessage
            : 'Ceza kuralları kaydedilemedi.';
        setError(message);
        toast.error(message);
      } else {
        setError('Ceza kuralları kaydedilemedi.');
        toast.error('Ceza kuralları kaydedilemedi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="mx-auto w-full max-w-[800px]">
        <div className="mb-8">
          <h1 className="font-headline-lg text-headline-lg text-on-background mb-2">
            Ceza Kuralları Yapılandırması
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            No-Show durumları için sistem ceza parametrelerini belirleyin.
          </p>
        </div>

        {loading ? (
          <Loading label="Ceza kuralları yükleniyor..." />
        ) : (
          <>
            <div className="relative overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-6 md:p-8">
              <div className="pointer-events-none absolute -right-32 -top-32 h-64 w-64 rounded-full bg-primary-fixed-dim/20 blur-3xl" />

              <form className="relative z-10 space-y-8" onSubmit={(e) => void handleSubmit(e)}>
                <div className="space-y-6">
                  <div>
                    <label
                      className="mb-2 flex items-center gap-2 font-label-md text-label-md text-on-background"
                      htmlFor="max-noshow"
                    >
                      <span
                        className="material-symbols-outlined text-surface-tint"
                        style={{ fontSize: 18 }}
                      >
                        warning
                      </span>
                      No-Show Limiti (Max No Show)
                    </label>
                    <p className="mb-3 text-sm font-body-md text-body-md text-on-surface-variant">
                      Bir öğrencinin randevusuna gelmediği durumlar için izin verilen maksimum sayı.
                    </p>
                    <select
                      id="max-noshow"
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 px-4 font-body-md text-body-md text-on-background focus:border-primary-container focus:outline-none md:w-1/2"
                      value={form.maxNoShowCount}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          maxNoShowCount: Number(event.target.value),
                        }))
                      }
                      disabled={submitting}
                      required
                    >
                      {!MAX_NOSHOW_OPTIONS.includes(
                        form.maxNoShowCount as (typeof MAX_NOSHOW_OPTIONS)[number],
                      ) ? (
                        <option value={form.maxNoShowCount}>{form.maxNoShowCount}</option>
                      ) : null}
                      {MAX_NOSHOW_OPTIONS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <hr className="border-outline-variant/50" />

                  <div>
                    <label
                      className="mb-2 flex items-center gap-2 font-label-md text-label-md text-on-background"
                      htmlFor="ban-duration-days"
                    >
                      <span
                        className="material-symbols-outlined text-surface-tint"
                        style={{ fontSize: 18 }}
                      >
                        schedule
                      </span>
                      Ceza Süresi (Ban Duration Days)
                    </label>
                    <p className="mb-3 text-sm font-body-md text-body-md text-on-surface-variant">
                      Maksimum sınıra ulaşıldığında uygulanacak randevu alma kısıtlamasının süresi
                      (gün).
                    </p>
                    <input
                      id="ban-duration-days"
                      type="number"
                      min={1}
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 px-4 font-body-md text-body-md text-on-background focus:border-primary-container focus:outline-none md:w-1/2"
                      value={form.banDurationDays}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          banDurationDays: Number(event.target.value),
                        }))
                      }
                      disabled={submitting}
                      required
                    />
                  </div>

                  <hr className="border-outline-variant/50" />

                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <label className="mb-1 flex items-center gap-2 font-label-md text-label-md text-on-background">
                        <span
                          className="material-symbols-outlined text-surface-tint"
                          style={{ fontSize: 18 }}
                        >
                          rule
                        </span>
                        Sistem Aktif mi?
                      </label>
                      <p className="text-sm font-body-md text-body-md text-on-surface-variant">
                        Sistemi etkinleştirin veya devre dışı bırakın.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                        Pasif
                      </span>
                      <label className="mars-switch">
                        <input
                          id="system-active-toggle"
                          type="checkbox"
                          checked={Boolean(form.isActive)}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              isActive: event.target.checked,
                            }))
                          }
                          disabled={submitting}
                        />
                        <span className="mars-switch-track" aria-hidden="true" />
                      </label>
                      <span
                        className={`font-label-sm text-label-sm uppercase tracking-wider ${
                          form.isActive
                            ? 'font-bold text-primary-container'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        Aktif
                      </span>
                    </div>
                  </div>
                </div>

                {error ? (
                  <p className="font-label-sm text-label-sm text-error" role="alert">
                    {error}
                  </p>
                ) : null}

                <div className="mt-8 flex justify-end border-t border-outline-variant/50 pt-6">
                  <button
                    type="submit"
                    className="bg-primary text-on-primary px-6 py-3 rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={submitting}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                      save
                    </span>
                    {submitting ? (
                      <Loading variant="inline" label={UI_LABELS.submitting} className="text-on-primary" />
                    ) : (
                      'Kuralları Kaydet'
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-8 flex items-start gap-4 rounded-lg border border-outline-variant/50 bg-surface-container-low p-5">
              <div className="mt-1 shrink-0 rounded-full bg-surface-tint/10 p-2 text-surface-tint">
                <span className="material-symbols-outlined">info</span>
              </div>
              <div>
                <h2 className="mb-1 text-lg font-headline-md text-headline-md text-on-background">
                  Cezalar Nasıl Uygulanır?
                </h2>
                <p className="text-sm leading-relaxed font-body-md text-body-md text-on-surface-variant">
                  Yapılandırılan kurallar, kaydedildiği andan itibaren gerçekleşecek yeni
                  &quot;No-Show&quot; durumları için geçerli olacaktır. Geçmişteki randevular için
                  geriye dönük bir ceza işlemi uygulanmaz. Sistem durumunu &quot;Pasif&quot; konuma
                  getirdiğinizde, halihazırda cezalı olan kullanıcıların cezaları kaldırılmaz,
                  sadece yeni ceza atanması durdurulur.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
