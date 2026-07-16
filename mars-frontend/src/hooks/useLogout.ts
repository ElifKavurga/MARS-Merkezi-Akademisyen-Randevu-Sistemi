import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

export function useLogout() {
  const { clearSession } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  return () => {
    clearSession();
    toast.info('Oturum kapatıldı.');
    navigate(ROUTES.LOGIN, { replace: true });
  };
}
