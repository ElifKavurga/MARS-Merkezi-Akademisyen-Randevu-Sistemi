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
  description: string;
}> = [
  { key: 'appointmentRequest', description: 'Yeni bir randevu talebi geldiğinde bildir' },
  { key: 'appointmentApproval', description: 'Randevunuz onaylandığında bildir' },
  { key: 'appointmentRejection', description: 'Randevunuz reddedildiğinde bildir' },
  { key: 'appointmentCancellation', description: 'Randevunuz iptal edildiğinde bildir' },
  { key: 'appointmentReminder', description: 'Yaklaşan randevularınız için hatırlatma gönder' },
  { key: 'waitlist', description: 'Bekleme listesinde sıranız geldiğinde bildir' },
  { key: 'systemAnnouncements', description: 'Sistem güncellemeleri ve önemli duyuruları bildir' },
];

type EmailNotificationPreferencesProps = {
  className?: string;
};

export default function EmailNotificationPreferences({ className = '' }: EmailNotificationPreferencesProps) {
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
    <section className={`overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm ${className}`}>
      <div className="border-b border-outline-variant bg-surface-container-lowest/50 px-4 py-4 sm:px-5">
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
              <div 
                key={item.key} 
                onClick={() => toggle(item.key)}
                className="flex cursor-pointer items-center justify-between gap-3 bg-surface-container-lowest px-4 py-2.5 transition-colors hover:bg-surface-container-low sm:px-5"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(item.key); } }}
              >
                <div className="min-w-0">
                  <p className="font-body-md text-on-surface">{item.description}</p>
                </div>
                <div
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${
                    preferences[item.key] ? 'bg-primary' : 'bg-surface-variant shadow-inner'
                  }`}
                >
                  <div
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${
                      preferences[item.key] ? 'left-6' : 'left-1'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end border-t border-outline-variant bg-surface-container-lowest px-4 py-3 sm:px-5">
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
