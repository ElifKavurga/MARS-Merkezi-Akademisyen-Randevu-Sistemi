export default function HodPageHeader({
  title,
  description: _description,
  backAction: _backAction,
}: {
  title: string;
  description: string;
  backAction?: {
    label: string;
    to: string;
  };
}) {
  return (
    <div className="mb-4 w-full min-w-0">
      <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
        {title}
      </h1>
    </div>
  );
}
