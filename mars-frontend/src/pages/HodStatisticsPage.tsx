export default function HodStatisticsPage() {
  return (
    <div className="w-full min-w-0 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
          Bölüm İstatistikleri
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Bölümünüze ait randevu ve akademisyen istatistiklerini inceleyin.
        </p>
      </div>

      <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-8 text-center">
        <span
          className="material-symbols-outlined mb-4 block text-5xl text-outline-variant"
          aria-hidden="true"
        >
          bar_chart
        </span>
        <p className="font-title-md text-title-md text-on-surface mb-2">
          Bu modül yakında kullanıma sunulacaktır
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Bölüm istatistikleri işlevleri sonraki sürümlerde geliştirilecektir.
        </p>
      </div>
    </div>
  );
}
