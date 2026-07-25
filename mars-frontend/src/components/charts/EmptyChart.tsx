export default function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-on-surface-variant animate-fade-in">
      <span className="material-symbols-outlined mb-2 text-4xl text-outline-variant">bar_chart</span>
      <p className="font-body-sm text-body-sm">Henüz veri bulunmuyor</p>
    </div>
  );
}
