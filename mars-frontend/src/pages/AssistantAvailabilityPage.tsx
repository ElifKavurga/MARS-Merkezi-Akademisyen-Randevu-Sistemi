import AcademicianAvailabilityPage from './AcademicianAvailabilityPage';

const ASSISTANT_AVAILABILITY_LABELS = {
  title: 'Müsaitliklerim',
  subtitle: 'Kendi müsaitliklerinizi görüntüleyin, oluşturun ve yönetin.',
  createButton: 'Yeni Müsaitlik Ekle',
  emptyTitle: 'Henüz müsaitlik tanımlamadınız.',
  emptyCta: 'Yeni Müsaitlik Ekle',
  loading: 'Müsaitlikleriniz yükleniyor...',
} as const;

export default function AssistantAvailabilityPage() {
  return <AcademicianAvailabilityPage labels={ASSISTANT_AVAILABILITY_LABELS} />;
}
