import { useAuth } from '../hooks/useAuth';

export default function AssistantDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="border-b border-outline-variant bg-[#0b1641] px-5 py-6 text-white sm:px-8 sm:py-8">
          <p className="font-label-md text-label-md text-white/70">Asistan Paneli</p>
          <h1 className="mt-1 font-headline-lg text-headline-lg text-white">
            Hoş Geldiniz{user?.fullName ? `, ${user.fullName}` : ''}
          </h1>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
              <span className="material-symbols-outlined" aria-hidden="true">
                school
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="font-headline-md text-headline-md text-on-background">
                Asistan Modülü
              </h2>
              <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">
                Asistan panelinden size atanan akademik görevleri ve yetkilendirildiğiniz işlemleri
                yönetebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
