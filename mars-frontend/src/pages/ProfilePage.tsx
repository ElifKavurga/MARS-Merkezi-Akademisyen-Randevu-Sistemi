import { useEffect, useState } from 'react';
import { getRoleLabel, UI_LABELS } from '../constants';
import { getInitials } from '../utils/userDisplay';
import Loading from '../components/Loading';
import EmailNotificationPreferences from '../components/EmailNotificationPreferences';
import { getMyProfile, updateMyProfile, type UserProfile } from '../services/profileService';
import { useToast } from '../hooks/useToast';
import { isAxiosError } from 'axios';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getMyProfile();
        setProfile(data);
        setPhoneInput(data.phone || '');
      } catch (err) {
        setError('Profil bilgileri yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };
    void loadProfile();
  }, []);

  const handlePhoneSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const updated = await updateMyProfile({ phone: phoneInput });
      setProfile(updated);
      setIsEditingPhone(false);
      toast.success('Telefon numarası güncellendi.');
    } catch (err) {
      if (isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Telefon numarası güncellenemedi.');
      }
    } finally {
      setIsSaving(false);
    }
  };

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

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-background">Profil Bilgileri</h1>
        <p className="mt-2 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
          Hesap bilgilerinizi görüntüleyin. Sadece telefon numaranızı güncelleyebilirsiniz.
        </p>
      </div>

      <div className="mb-6 max-w-3xl overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="flex items-center gap-4 border-b border-outline-variant p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-outline-variant bg-surface-container-highest font-headline-md text-lg text-primary">
            {getInitials(profile.fullName) || '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate font-headline-md text-body-lg text-on-background">
              {profile.fullName}
            </p>
            <p className="truncate font-body-md text-body-md text-on-surface-variant">
              {profile.institutionalEmail}
            </p>
            <p className="mt-0.5 truncate font-label-sm text-label-sm text-on-surface-variant">
              {getRoleLabel(profile.role)}
            </p>
          </div>
        </div>

        <dl className="divide-y divide-outline-variant/60">
          <div className="grid gap-1 px-6 py-4 sm:grid-cols-[12rem_1fr] sm:items-center">
            <dt className="font-label-md text-label-md text-on-surface-variant">Ad Soyad</dt>
            <dd className="break-words font-body-md text-body-md text-on-surface">
              {profile.fullName}
            </dd>
          </div>
          <div className="grid gap-1 px-6 py-4 sm:grid-cols-[12rem_1fr] sm:items-center">
            <dt className="font-label-md text-label-md text-on-surface-variant">Kurumsal E-Posta</dt>
            <dd className="break-words font-body-md text-body-md text-on-surface">
              {profile.institutionalEmail}
            </dd>
          </div>
          
          <div className="grid gap-1 px-6 py-4 sm:grid-cols-[12rem_1fr] sm:items-center">
            <dt className="font-label-md text-label-md text-on-surface-variant">Telefon</dt>
            <dd className="break-words font-body-md text-body-md text-on-surface">
              {isEditingPhone ? (
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    className="flex-1 rounded-md border border-outline-variant bg-surface-container px-3 py-1.5 text-body-md text-on-background focus:border-primary focus:outline-none"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="Örn: 05xxxxxxxxx"
                    disabled={isSaving}
                  />
                  <button
                    type="button"
                    onClick={handlePhoneSave}
                    disabled={isSaving}
                    className="rounded-md bg-primary px-3 py-1.5 text-label-md font-medium text-on-primary hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPhone(false);
                      setPhoneInput(profile.phone || '');
                    }}
                    disabled={isSaving}
                    className="rounded-md border border-outline-variant bg-transparent px-3 py-1.5 text-label-md font-medium text-on-surface hover:bg-surface-container disabled:opacity-50"
                  >
                    İptal
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span>{profile.phone || <span className="italic text-on-surface-variant">Belirtilmemiş</span>}</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(true)}
                    className="font-label-md text-primary hover:underline"
                  >
                    Düzenle
                  </button>
                </div>
              )}
            </dd>
          </div>

          <div className="grid gap-1 px-6 py-4 sm:grid-cols-[12rem_1fr] sm:items-center">
            <dt className="font-label-md text-label-md text-on-surface-variant">Rol</dt>
            <dd className="break-words font-body-md text-body-md text-on-surface">
              {getRoleLabel(profile.role)}
            </dd>
          </div>
          
          {profile.department && profile.department.trim() !== '' && (
            <div className="grid gap-1 px-6 py-4 sm:grid-cols-[12rem_1fr] sm:items-center">
              <dt className="font-label-md text-label-md text-on-surface-variant">Bölüm</dt>
              <dd className="break-words font-body-md text-body-md text-on-surface">
                {profile.department}
              </dd>
            </div>
          )}

          {profile.academicTitle && profile.academicTitle.trim() !== '' && (
            <div className="grid gap-1 px-6 py-4 sm:grid-cols-[12rem_1fr] sm:items-center">
              <dt className="font-label-md text-label-md text-on-surface-variant">Unvan</dt>
              <dd className="break-words font-body-md text-body-md text-on-surface">
                {profile.academicTitle}
              </dd>
            </div>
          )}

          <div className="grid gap-1 px-6 py-4 sm:grid-cols-[12rem_1fr] sm:items-center">
            <dt className="font-label-md text-label-md text-on-surface-variant">Hesap Durumu</dt>
            <dd className="break-words font-body-md text-body-md text-on-surface">
              <span
                className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 font-label-sm text-label-sm ${
                  profile.isActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {profile.isActive ? 'Aktif' : 'Pasif'}
              </span>
            </dd>
          </div>
        </dl>
      </div>
      
      <EmailNotificationPreferences />
    </div>
  );
}
