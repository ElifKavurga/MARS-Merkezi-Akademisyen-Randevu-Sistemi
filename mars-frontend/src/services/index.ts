export { apiClient } from './apiClient';
export { login, resetPassword } from './authService';
export {
  registerClearSessionHandler,
  unregisterClearSessionHandler,
  triggerClearSession,
} from './authSessionBridge';
export { getRoles } from './roleService';
export { getDepartments } from './departmentService';
export { getAdminUsers, createAdminUser, updateAdminUser, changeAdminUserStatus } from './adminUserService';
export {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from './adminCategoryService';
export {
  getAdminPenaltyRule,
  updateAdminPenaltyRule,
} from './adminPenaltyRuleService';
export {
  getMyCourses,
  getMyCourse,
  getCourseStats,
  getCourseAssistants,
  assignCourseAssistant,
  updateCourseAssignment,
  removeCourseAssignment,
  createCourse,
  updateCourse,
  changeCourseStatus,
} from './courseService';
export { getUsersByRole, getActiveAssistants } from './userService';
export {
  getMyAvailabilitySlots,
  getMyAvailabilityStats,
  createAvailabilitySlots,
  updateAvailabilitySlot,
  updateAvailabilitySlotBlocked,
} from './availabilityService';
export {
  createAppointment,
  getAvailableSlots,
  getAppointmentCategories,
  getStaffAppointments,
  getStaffAppointment,
  approveStaffAppointment,
  rejectStaffAppointment,
} from './appointmentService';
export {
  createRecurrenceRule,
  getRecurrenceRule,
  updateRecurrenceRule,
  endRecurrenceRule,
} from './recurrenceService';
export { getCalendarEvents } from './calendarService';
export { getAssistantCourses, getAssistantDashboard } from './assistantCourseService';
export { getAcademicianDashboardSummary } from './academicianDashboardService';
export {
  getMyOutOfOfficePeriods,
  createOutOfOfficePeriod,
  updateOutOfOfficePeriod,
  endOutOfOfficePeriod,
} from './outOfOfficeService';
