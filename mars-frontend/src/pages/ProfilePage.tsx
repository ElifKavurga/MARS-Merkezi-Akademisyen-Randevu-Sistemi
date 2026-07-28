import { useEffect, useState } from 'react';
import { getRoleLabel, UI_LABELS } from '../constants';
import { getInitials } from '../utils/userDisplay';
import Loading from '../components/Loading';
import ChangePasswordSecurityCard from '../components/ChangePasswordSecurityCard';
import EmailNotificationPreferences from '../components/EmailNotificationPreferences';
import { getMyProfile, type UserProfile } from '../services/profileService';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getMyProfile();
        setProfile(data);
      } catch (err) {
        setError('Profil bilgileri yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };
    void loadProfile();
  }, []);

  if (loading) {
    return <Loading variant="page" label={UI_LABELS.loading} />;
  }

  if (error || !profile) {
    return (
      <div className="flex justify-center p-8">
        <p className="text-error">{error}</p>
      </div>
    );
  }

  const renderReadOnlyField = (label: string, value: string, icon: string) => (
    <div className="flex flex-col gap-1 px-4 py-2 sm:flex-row sm:items-center sm:gap-3 sm:px-5">
      <dt className="flex w-36 items-center gap-2 font-label-md text-label-md text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] opacity-70" aria-hidden="true">{icon}</span>
        {label}
      </dt>
      <dd className="flex-1 break-words rounded-lg border border-outline-variant/50 bg-surface-container/30 px-3 py-1.5 font-body-sm text-body-sm text-on-surface/80">
        {value}
      </dd>
    </div>
  );

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <div className="mb-3">
        <h1 className="font-headline-md text-headline-md text-on-background">Profil Bilgileri</h1>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="flex flex-col gap-3 border-b border-outline-variant bg-surface-container-lowest/50 p-3 sm:flex-row sm:items-center sm:px-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary/20 bg-primary-container font-headline-md text-base text-on-primary-container shadow-sm">
              {getInitials(profile.fullName) || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-headline-md text-body-lg text-on-background">
                {profile.fullName}
              </p>
              <p className="truncate font-body-md text-body-md text-on-surface-variant">
                {profile.institutionalEmail}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-outline-variant/50 bg-surface-container px-2.5 py-0.5 font-label-sm text-xs font-medium text-on-surface-variant">
                  {getRoleLabel(profile.role)}
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-label-sm text-xs font-medium ${
                    profile.isActive
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {profile.isActive ? 'Aktif Hesap' : 'Pasif Hesap'}
                </span>
              </div>
            </div>
          </div>

          <dl className="divide-y divide-outline-variant/40">
            {renderReadOnlyField('Ad Soyad', profile.fullName, 'person')}
            {renderReadOnlyField('Kurumsal E-Posta', profile.institutionalEmail, 'mail')}
            {profile.department && profile.department.trim() !== ''
              ? renderReadOnlyField('Bölüm', profile.department, 'domain')
              : null}
            {profile.academicTitle && profile.academicTitle.trim() !== ''
              ? renderReadOnlyField('Unvan', profile.academicTitle, 'school')
              : null}
          </dl>
          <ChangePasswordSecurityCard embedded />
        </section>

        <EmailNotificationPreferences />
      </div>
    </div>
  );
}
