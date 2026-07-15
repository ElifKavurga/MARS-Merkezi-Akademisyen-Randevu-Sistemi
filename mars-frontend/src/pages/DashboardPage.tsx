import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getHomePathForRole } from '../constants';

/** Token varsa rol ana sayfasına yönlendirir. */
export default function DashboardPage() {
  const { user } = useAuth();
  return <Navigate to={getHomePathForRole(user?.role)} replace />;
}
