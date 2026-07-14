import type { DepartmentOption } from '../types/department';
import type { RoleOption } from '../types/role';

export function resolveRoleIdByName(roles: RoleOption[], roleName: string): number {
  const match = roles.find((role) => role.roleName === roleName);
  return match?.roleId ?? roles[0]?.roleId ?? 0;
}

export function resolveDepartmentIdByName(
  departments: DepartmentOption[],
  departmentName: string,
): number {
  const match = departments.find((department) => department.departmentName === departmentName);
  return match?.departmentId ?? departments[0]?.departmentId ?? 0;
}
