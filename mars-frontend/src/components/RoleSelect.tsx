import { useEffect } from 'react';
import { FORM_SELECT_CLASS, getRoleLabel, UI_LABELS } from '../constants';
import { useRoles } from '../hooks/useRoles';
import Loading from './Loading';

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

export default function RoleSelect({
  id,
  value,
  onChange,
  disabled = false,
  required = false,
  className = FORM_SELECT_CLASS,
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
    return <Loading variant="inline" label={UI_LABELS.rolesLoading} />;
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
