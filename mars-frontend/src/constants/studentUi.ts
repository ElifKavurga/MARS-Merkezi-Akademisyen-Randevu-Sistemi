export const STUDENT_UI = {
  RETRY: 'Tekrar Dene',
  BREADCRUMB_HOME: 'Ana Sayfa',
  BREADCRUMB_SEARCH: 'Randevu Al',
  BREADCRUMB_APPOINTMENTS: 'Randevularım',
  BREADCRUMB_PROFILE: 'Profil Detayı',
  DASHBOARD_TITLE: 'Ana Sayfa',
  DASHBOARD_SUBTITLE:
    'Randevu süreçlerinizi, bekleme listelerinizi ve ceza durumunuzu buradan takip edebilirsiniz.',
  DASHBOARD_LOADING: 'Ana sayfa yükleniyor...',
  INFO_TITLE: 'Bilgilendirme',
  INFO_DESCRIPTION:
    'Akademisyen veya araştırma görevlilerinden randevu almak için Randevu Al menüsünü kullanabilirsiniz.',
  UPCOMING_TITLE: 'Yaklaşan Randevular',
  UPCOMING_EMPTY_TITLE: 'Yaklaşan randevu yok',
  UPCOMING_EMPTY_DESCRIPTION: 'Yaklaşan randevularınız burada görüntülenecek.',
  UPCOMING_LOADING: 'Yaklaşan randevular yükleniyor...',
  WAITLIST_TITLE: 'Bekleme Listesi',
  WAITLIST_EMPTY_TITLE: 'Bekleme listesi boş',
  WAITLIST_EMPTY_DESCRIPTION: 'Bekleme listesi kayıtlarınız burada görüntülenecek.',
  WAITLIST_LOADING: 'Bekleme listesi yükleniyor...',
  PENALTY_TITLE: 'Ceza Durumu',
  PENALTY_EMPTY_TITLE: 'Ceza kaydı yok',
  PENALTY_EMPTY_DESCRIPTION: 'Ceza durumunuz burada görüntülenecek.',
  PENALTY_LOADING: 'Ceza durumu yükleniyor...',
  PROFILE_TITLE: 'Profil Detayı',
  PROFILE_SUBTITLE:
    'Personel bilgilerini, derslerini ve uygun randevu saatlerini inceleyin.',
  LOAD_ERROR_GENERIC: 'Veri yüklenemedi. Lütfen tekrar deneyin.',
  ACCESS_DENIED: 'Bu işlem için yetkiniz yok.',
  NOT_FOUND_GENERIC: 'İstenen kayıt bulunamadı.',
  PRIMARY_BUTTON_CLASS:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-primary-container px-5 py-2.5 font-label-md text-label-md text-on-primary transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  SECONDARY_BUTTON_CLASS:
    'inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2.5 font-label-md text-label-md text-primary no-underline transition-colors hover:bg-surface-container hover:no-underline focus:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim focus-visible:ring-offset-2',
  DANGER_BUTTON_CLASS:
    'inline-flex items-center justify-center gap-1.5 rounded-lg border border-error/30 bg-error-container/40 px-3.5 py-2 font-label-md text-label-md text-error transition-colors hover:bg-error-container/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 disabled:cursor-not-allowed disabled:opacity-50',
  BACK_LINK_CLASS:
    'inline-flex items-center gap-1 rounded font-label-md text-label-md text-primary no-underline transition-colors hover:text-on-background hover:no-underline focus:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim',
  SEARCH_INPUT_CLASS:
    'h-11 w-full min-w-0 border-0 bg-transparent py-0 font-body-md text-body-md text-on-surface outline-none placeholder:text-on-surface-variant/70',
  SEARCH_ICON_CLASS:
    'material-symbols-outlined flex h-5 w-5 shrink-0 items-center justify-center text-[20px] leading-none text-on-surface-variant',
  FILTER_CONTROL_CLASS:
    'h-11 w-full min-w-0 rounded-lg border border-outline-variant/80 bg-surface-container-lowest px-3 font-body-md text-body-md text-on-surface outline-none transition-colors focus:border-primary-fixed-dim focus:ring-2 focus:ring-primary-fixed-dim/25',
  SEARCH_FIELD_WRAP_CLASS:
    'flex h-11 w-full min-w-0 items-center gap-2 rounded-lg border border-outline-variant/80 bg-surface-container-lowest px-3 transition-colors focus-within:border-primary-fixed-dim focus-within:ring-2 focus-within:ring-primary-fixed-dim/25',
} as const;
