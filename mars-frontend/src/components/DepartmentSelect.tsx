import { useEffect } from 'react';
import { useDepartments } from '../hooks/useDepartments';

type DepartmentSelectProps = {
  id: string;
  value: number;
  onChange: (departmentId: number) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  emptyLabel?: string;
  allowEmpty?: boolean;
  valueMode?: 'id' | 'name';
  nameValue?: string;
  onNameChange?: (departmentName: string) => void;
};

const DEFAULT_CLASS =
  'w-full py-2.5 pl-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container';

export default function DepartmentSelect({
  id,
  value,
  onChange,
  disabled = false,
  required = false,
  className = DEFAULT_CLASS,
  emptyLabel = 'Bölüm seçin',
  allowEmpty = false,
  valueMode = 'id',
  nameValue = '',
  onNameChange,
}: DepartmentSelectProps) {
  const { departments, loading, error } = useDepartments();

  useEffect(() => {
    if (valueMode !== 'id' || allowEmpty || departments.length === 0) {
      return;
    }
    const hasSelection = departments.some((department) => department.departmentId === value);
    if (!hasSelection) {
      onChange(departments[0].departmentId);
    }
  }, [allowEmpty, departments, onChange, value, valueMode]);

  if (loading) {
    return (
      <p className="font-label-sm text-label-sm text-on-surface-variant" role="status">
        Bölümler yükleniyor...
      </p>
    );
  }

  if (error) {
    return (
      <p className="font-label-sm text-label-sm text-error" role="alert">
        {error}
      </p>
    );
  }

  if (valueMode === 'name') {
    return (
      <select
        id={id}
        className={className}
        required={required}
        disabled={disabled || departments.length === 0}
        value={nameValue}
        onChange={(event) => onNameChange?.(event.target.value)}
        aria-label="Bölüm"
      >
        {allowEmpty ? <option value="">{emptyLabel}</option> : null}
        {departments.map((department) => (
          <option key={department.departmentId} value={department.departmentName}>
            {department.departmentName}
          </option>
        ))}
      </select>
    );
  }

  return (
    <select
      id={id}
      className={className}
      required={required}
      disabled={disabled || departments.length === 0}
      value={value || ''}
      onChange={(event) => onChange(Number(event.target.value))}
      aria-label="Bölüm"
    >
      {allowEmpty ? <option value="">{emptyLabel}</option> : null}
      {departments.map((department) => (
        <option key={department.departmentId} value={department.departmentId}>
          {department.departmentName}
        </option>
      ))}
    </select>
  );
}
