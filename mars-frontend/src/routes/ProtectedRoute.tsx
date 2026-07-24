import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../constants/routes';
import { getHomePathForRole, ROLES, type Role } from '../constants/roles';

type ProtectedRouteProps = {
  allowedRoles?: readonly Role[];
};

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role as Role)) {
    const isHodActingAsAcademician = user.role === ROLES.HOD && allowedRoles.includes(ROLES.ACADEMICIAN);
    if (!isHodActingAsAcademician) {
      return <Navigate to={getHomePathForRole(user.role)} replace />;
    }
  }

  return <Outlet />;
}
