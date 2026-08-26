# MARS ER Diagram Summary

## Toplam Entity Sayısı

19

## Toplam İlişki Sayısı

37

## OneToOne Sayısı

3

- `AvailabilitySlot` - `Appointment` (`appointment.slot_id` unique FK)
- `User` - `StudentPenaltyStatus` (`student_penalty_status.student_id` shared PK/FK)
- `User` - `UserEmailNotificationPreference` (`user_email_notification_preference.user_id` shared PK/FK)

## OneToMany Sayısı

34

## ManyToMany Sayısı

0

Not: `Course` ve assistant kullanıcıları arasındaki atama ilişkisi fiziksel veritabanında `course_assignment` entity tablosu ile tutulur.

## Enum Listesi

- `AppointmentErrorCode`
- `AppointmentReminderType`
- `AppointmentStatus`
- `CategoryGroup`
- `DelegationStatus`
- `EmailNotificationCategory`
- `MeetingType`
- `NotificationType`
- `OfficeHourType`
- `PenaltyNotificationEvent`
- `ReasonCode`
- `RecurrenceEndMode`
- `RepeatType`
- `RescheduleRequestStatus`
- `RoleType`
- `SlotLockStatus`
- `WaitlistNotificationEvent`
- `WaitlistStatus`

## PK Listesi

- `role.role_id`
- `department.department_id`
- `appointment_category.category_id`
- `penalty_rule.penalty_rule_id`
- `"user".user_id`
- `course.course_id`
- `course_assignment.course_assignment_id`
- `recurrence_rule.recurrence_rule_id`
- `availability_slot.slot_id`
- `out_of_office_period.out_of_office_id`
- `appointment.appointment_id`
- `delegation_log.delegation_id`
- `student_penalty_status.student_id`
- `waitlist_entry.waitlist_entry_id`
- `notification.notification_id`
- `appointment_reschedule_request.reschedule_request_id`
- `appointment_reminder_delivery.reminder_delivery_id`
- `user_email_notification_preference.user_id`
- `delegation_status_history.history_id`

## FK Listesi

- `"user".role_id -> role.role_id`
- `"user".department_id -> department.department_id`
- `course.department_id -> department.department_id`
- `course.owner_academician_id -> "user".user_id`
- `course_assignment.course_id -> course.course_id`
- `course_assignment.assistant_id -> "user".user_id`
- `recurrence_rule.staff_id -> "user".user_id`
- `availability_slot.staff_id -> "user".user_id`
- `availability_slot.recurrence_rule_id -> recurrence_rule.recurrence_rule_id`
- `out_of_office_period.staff_id -> "user".user_id`
- `appointment.student_id -> "user".user_id`
- `appointment.staff_id -> "user".user_id`
- `appointment.category_id -> appointment_category.category_id`
- `appointment.course_id -> course.course_id`
- `appointment.slot_id -> availability_slot.slot_id`
- `appointment.no_show_marked_by_user_id -> "user".user_id`
- `delegation_log.appointment_id -> appointment.appointment_id`
- `delegation_log.delegated_by_user_id -> "user".user_id`
- `delegation_log.delegated_to_user_id -> "user".user_id`
- `delegation_log.target_slot_id -> availability_slot.slot_id`
- `student_penalty_status.student_id -> "user".user_id`
- `student_penalty_status.penalty_rule_id -> penalty_rule.penalty_rule_id`
- `waitlist_entry.student_id -> "user".user_id`
- `waitlist_entry.staff_id -> "user".user_id`
- `waitlist_entry.category_id -> appointment_category.category_id`
- `waitlist_entry.course_id -> course.course_id`
- `waitlist_entry.slot_id -> availability_slot.slot_id`
- `notification.user_id -> "user".user_id`
- `notification.related_delegation_id -> delegation_log.delegation_id`
- `notification.related_appointment_id -> appointment.appointment_id`
- `appointment_reschedule_request.appointment_id -> appointment.appointment_id`
- `appointment_reschedule_request.original_slot_id -> availability_slot.slot_id`
- `appointment_reschedule_request.proposed_slot_id -> availability_slot.slot_id`
- `appointment_reminder_delivery.appointment_id -> appointment.appointment_id`
- `appointment_reminder_delivery.recipient_user_id -> "user".user_id`
- `user_email_notification_preference.user_id -> "user".user_id`
- `delegation_status_history.delegation_id -> delegation_log.delegation_id`

## Migration / Entity Uyum Notları

- Migration dosyaları ana kaynak kabul edildi.
- Entity sınıfları JPA ilişki yönü ve shared primary key doğrulaması için kullanıldı.
- `appointment.slot_id` alanı migration tarafında unique FK olduğu için `Appointment` - `AvailabilitySlot` ilişkisi one-to-one gösterildi.
- `course_assignment` ayrı tablo/entity olduğu için many-to-many ilişki üretilmedi.
- `notification.event_key` üzerinde `user_id + event_key` composite unique index bulunur.
- `appointment_reminder_delivery` üzerinde `appointment_id + recipient_user_id + reminder_type` composite unique constraint bulunur.
- `delegation_log` ve `appointment_reschedule_request` tablolarında aktif/bekleyen kayıtları sınırlayan partial unique indexler bulunur.
