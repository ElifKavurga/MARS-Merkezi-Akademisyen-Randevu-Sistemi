import { useEffect, useState } from 'react';
import { useToast } from '../hooks/useToast';
import {
  getMyEmailNotificationPreferences,
  updateMyEmailNotificationPreferences,
} from '../services/emailNotificationPreferenceService';
import type { EmailNotificationPreference } from '../types/emailNotificationPreference';
import AdminActionButton from './AdminActionButton';

const preferenceLabels: Array<{
  key: keyof EmailNotificationPreference;
  label: string;
  description: string;
}> = [
  { key: 'appointmentRequest', label: 'Randevu Talebi', description: 'Yeni randevu talepleri' },
  { key: 'appointmentApproval', label: 'Randevu Onayı', description: 'Onaylanan randevular' },
  { key: 'appointmentRejection', label: 'Randevu Reddi', description: 'Reddedilen randevular' },
  { key: 'appointmentCancellation', label: 'Randevu İptali', description: 'İptal edilen randevular' },
  { key: 'reschedule', label: 'Yeniden Planlama', description: 'Tarih değişikliği süreçleri' },
  { key: 'delegation', label: 'Randevu Devri', description: 'Randevu devri ve onay süreçleri' },
  { key: 'appointmentReminder', label: 'Randevu Hatırlatmaları', description: '24 saat ve 1 saat hatırlatmaları' },
  { key: 'waitlist', label: 'Waitlist Bildirimleri', description: 'Bekleme listesi gelişmeleri' },
  { key: 'noShow', label: 'No-Show Bildirimleri', description: 'Katılım durumu bilgilendirmeleri' },
  { key: 'penalty', label: 'Ceza Bildirimleri', description: 'Kısıtlama ve ceza gelişmeleri' },
];

export default function EmailNotificationPreferences() {
  const toast = useToast();
  const [preferences, setPreferences] = useState<EmailNotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void getMyEmailNotificationPreferences()
      .then((data) => active && setPreferences(data))
      .catch(() => active && toast.error('E-posta tercihleri yüklenemedi.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [toast]);

  const toggle = (key: keyof EmailNotificationPreference) => {
    setPreferences((current) => current && { ...current, [key]: !current[key] });
  };

  const save = async () => {
    if (!preferences) return;
    setSaving(true);
    try {
      const updated = await updateMyEmailNotificationPreferences(preferences);
      setPreferences(updated);
      toast.success('E-posta bildirim tercihleriniz kaydedildi.');
    } catch {
      toast.error('E-posta tercihleri kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-8 max-w-3xl overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
      <div className="border-b border-outline-variant px-5 py-5 sm:px-6 bg-surface-container-lowest/50">
        <h2 className="font-headline-md text-body-lg text-on-background">E-Posta Bildirim Tercihleri</h2>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
          Uygulama içi bildirimleriniz değişmeden, almak istediğiniz e-postaları yönetin.
        </p>
      </div>

      {loading ? (
        <p className="px-6 py-8 font-body-md text-body-md text-on-surface-variant">Tercihler yükleniyor...</p>
      ) : preferences ? (
        <>
          <div className="divide-y divide-outline-variant/40">
            {preferenceLabels.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6 bg-surface-container-lowest">
                <div className="min-w-0">
                  <p className="font-label-md text-label-md text-on-surface">{item.label}</p>
                  <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">{item.description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences[item.key]}
                  aria-label={`${item.label} e-postalarını ${preferences[item.key] ? 'kapat' : 'aç'}`}
                  onClick={() => toggle(item.key)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    preferences[item.key] ? 'bg-primary' : 'bg-surface-container-highest border border-outline-variant/60'
                  }`}
                >
                  <span
                    className={`absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      preferences[item.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-end border-t border-outline-variant bg-surface-container-lowest px-5 py-4 sm:px-6">
            <AdminActionButton
              variant="primary"
              icon="save"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? 'Kaydediliyor' : 'Tercihleri Kaydet'}
            </AdminActionButton>
          </div>
        </>
      ) : (
        <p className="px-6 py-8 font-body-md text-body-md text-error">Tercihler görüntülenemedi.</p>
      )}
    </section>
  );
}
