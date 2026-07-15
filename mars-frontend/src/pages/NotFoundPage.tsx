import { Link } from 'react-router-dom';
import { ROUTES, getHomePathForRole } from '../constants';
import { useAuth } from '../hooks/useAuth';

export default function NotFoundPage() {
  const { isAuthenticated, user } = useAuth();
  const homePath =
    isAuthenticated && user ? getHomePathForRole(user.role) : ROUTES.LOGIN;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-surface text-on-surface">
      <p className="font-headline-lg text-6xl font-bold text-on-surface-variant">404</p>
      <h1 className="font-headline-md text-headline-md text-on-surface">Sayfa bulunamadı</h1>
      <p className="font-body-md text-body-md text-on-surface-variant text-center max-w-sm">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <Link
        to={homePath}
        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#0b1641] text-on-primary font-label-md text-label-md hover:bg-black transition-colors"
      >
        Ana sayfaya dön
      </Link>
    </div>
  );
}
