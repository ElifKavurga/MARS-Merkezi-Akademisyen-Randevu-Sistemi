import { useEffect, useState } from 'react';
import { getDepartments } from '../services/departmentService';
import type { DepartmentOption } from '../types/department';

type UseDepartmentsResult = {
  departments: DepartmentOption[];
  loading: boolean;
  error: string | null;
};

export function useDepartments(): UseDepartmentsResult {
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDepartments();
        if (!cancelled) {
          setDepartments(data);
        }
      } catch {
        if (!cancelled) {
          setError('Bölümler yüklenemedi. Lütfen tekrar deneyin.');
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

  return { departments, loading, error };
}
