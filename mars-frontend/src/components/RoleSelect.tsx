import { useEffect } from 'react';
import { getRoleLabel } from '../constants';
import { useRoles } from '../hooks/useRoles';

type RoleSelectProps = {
  id: string;
  value: number;
  onChange: (roleId: number) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  emptyLabel?: string;
  allowEmpty?: boolean;
  valueMode?: 'id' | 'name';
  nameValue?: string;
  onNameChange?: (roleName: string) => void;
};

const DEFAULT_CLASS =
  'w-full py-2.5 pl-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container';

export default function RoleSelect({
  id,
  value,
  onChange,
  disabled = false,
  required = false,
  className = DEFAULT_CLASS,
  emptyLabel = 'Rol seçin',
  allowEmpty = false,
  valueMode = 'id',
  nameValue = '',
  onNameChange,
}: RoleSelectProps) {
  const { roles, loading, error } = useRoles();

  useEffect(() => {
    if (valueMode !== 'id' || allowEmpty || roles.length === 0) {
      return;
    }
    const hasSelection = roles.some((role) => role.roleId === value);
    if (!hasSelection) {
      onChange(roles[0].roleId);
    }
  }, [allowEmpty, onChange, roles, value, valueMode]);

  if (loading) {
    return (
      <p className="font-label-sm text-label-sm text-on-surface-variant" role="status">
        Roller yükleniyor...
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
        disabled={disabled || roles.length === 0}
        value={nameValue}
        onChange={(event) => onNameChange?.(event.target.value)}
        aria-label="Rol"
      >
        {allowEmpty ? <option value="">{emptyLabel}</option> : null}
        {roles.map((role) => (
          <option key={role.roleId} value={role.roleName}>
            {getRoleLabel(role.roleName) || role.roleName}
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
      disabled={disabled || roles.length === 0}
      value={value || ''}
      onChange={(event) => onChange(Number(event.target.value))}
      aria-label="Rol"
    >
      {allowEmpty ? <option value="">{emptyLabel}</option> : null}
      {roles.map((role) => (
        <option key={role.roleId} value={role.roleId}>
          {getRoleLabel(role.roleName) || role.roleName}
        </option>
      ))}
    </select>
  );
}
