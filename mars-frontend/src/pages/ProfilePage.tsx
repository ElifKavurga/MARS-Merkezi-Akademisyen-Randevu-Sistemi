import { useEffect, useState } from 'react';
import { getRoleLabel, UI_LABELS } from '../constants';
import { getInitials } from '../utils/userDisplay';
import Loading from '../components/Loading';
import EmailNotificationPreferences from '../components/EmailNotificationPreferences';
import { getMyProfile, updateMyProfile, type UserProfile } from '../services/profileService';
import { useToast } from '../hooks/useToast';
import { isAxiosError } from 'axios';
import AdminActionButton from '../components/AdminActionButton';
import { FORM_FIELD_CLASS } from '../constants/ui';

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
      toast.success('Telefon numarası başarıyla güncellendi.');
    } catch (err) {
      if (isAxiosError(err) && err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Telefon numarası güncellenirken bir hata oluştu.');
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

  const renderReadOnlyField = (label: string, value: string, icon: string) => (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4 px-6 py-4">
      <dt className="w-48 font-label-md text-label-md text-on-surface-variant flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] opacity-70" aria-hidden="true">{icon}</span>
        {label}
      </dt>
      <dd className="flex-1 break-words font-body-md text-body-md text-on-surface/80 bg-surface-container/30 px-3 py-2 rounded-lg border border-outline-variant/50">
        {value}
      </dd>
    </div>
  );

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-background">Profil Bilgileri</h1>
        <p className="mt-2 max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
          Kişisel bilgilerinizi görüntüleyebilir, gerekli alanları düzenleyebilirsiniz.
        </p>
      </div>

      <div className="mb-8 max-w-3xl overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 border-b border-outline-variant p-6 bg-surface-container-lowest/50">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-primary/20 bg-primary-container font-headline-md text-xl text-on-primary-container shadow-sm">
            {getInitials(profile.fullName) || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-headline-md text-body-lg text-on-background">
              {profile.fullName}
            </p>
            <p className="truncate font-body-md text-body-md text-on-surface-variant">
              {profile.institutionalEmail}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-surface-container px-2.5 py-0.5 font-label-sm text-xs font-medium text-on-surface-variant border border-outline-variant/50">
                {getRoleLabel(profile.role)}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-label-sm text-xs font-medium border ${
                  profile.isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
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
          
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 px-6 py-5 bg-surface-container-low/30">
            <dt className="w-48 font-label-md text-label-md text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">phone_iphone</span>
              Telefon Numarası
            </dt>
            <dd className="flex-1">
              {isEditingPhone ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant opacity-70 text-[20px]" aria-hidden="true">
                      call
                    </span>
                    <input
                      type="tel"
                      className={`${FORM_FIELD_CLASS} pl-10 bg-surface-container-lowest`}
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="Örn: 05xxxxxxxxx"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <AdminActionButton
                      variant="primary"
                      icon="save"
                      onClick={handlePhoneSave}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Kaydediliyor' : 'Kaydet'}
                    </AdminActionButton>
                    <AdminActionButton
                      variant="neutral"
                      icon="close"
                      onClick={() => {
                        setIsEditingPhone(false);
                        setPhoneInput(profile.phone || '');
                      }}
                      disabled={isSaving}
                    >
                      İptal
                    </AdminActionButton>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-surface-container-lowest border border-outline-variant px-4 py-2.5 rounded-lg shadow-sm">
                  <span className="font-body-md text-on-background font-medium">
                    {profile.phone || <span className="italic text-on-surface-variant font-normal">Belirtilmemiş</span>}
                  </span>
                  <AdminActionButton
                    variant="neutral"
                    icon="edit"
                    onClick={() => setIsEditingPhone(true)}
                  >
                    Düzenle
                  </AdminActionButton>
                </div>
              )}
            </dd>
          </div>
          
          {profile.department && profile.department.trim() !== '' && 
            renderReadOnlyField('Bölüm', profile.department, 'domain')
          }

          {profile.academicTitle && profile.academicTitle.trim() !== '' && 
            renderReadOnlyField('Unvan', profile.academicTitle, 'school')
          }
        </dl>
      </div>
      
      <EmailNotificationPreferences />
    </div>
  );
}
