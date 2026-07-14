import { useEffect, useState } from 'react';
import { getRoles } from '../services/roleService';
import type { RoleOption } from '../types/role';

type UseRolesResult = {
  roles: RoleOption[];
  loading: boolean;
  error: string | null;
};

export function useRoles(): UseRolesResult {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getRoles();
        if (!cancelled) {
          setRoles(data);
        }
      } catch {
        if (!cancelled) {
          setError('Roller yüklenemedi. Lütfen tekrar deneyin.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { roles, loading, error };
}
