package com.mars.mapper;

import java.time.LocalDateTime;

import org.springframework.stereotype.Component;

import com.mars.dto.AssistantAppointmentResponseDto;
import com.mars.dto.AppointmentCreateRequest;
import com.mars.dto.AppointmentResponseDto;
import com.mars.entity.Appointment;
import com.mars.entity.AppointmentCategory;
import com.mars.entity.AvailabilitySlot;
import com.mars.entity.Course;
import com.mars.entity.User;
import com.mars.enums.AppointmentStatus;

@Component
public class AppointmentMapper {

    public Appointment toEntity(
            AppointmentCreateRequest request,
            User student,
            AvailabilitySlot slot,
            AppointmentCategory category,
            Course course,
            String meetingType) {
        LocalDateTime now = LocalDateTime.now();
        Appointment appointment = new Appointment();
        appointment.setStudent(student);
        appointment.setStaff(slot.getStaff());
        appointment.setCategory(category);
        appointment.setCourse(course);
        appointment.setSlot(slot);
        appointment.setAppointmentStatus(AppointmentStatus.PENDING.name());
        appointment.setMeetingType(meetingType);
        appointment.setIsLimitedDuration(Boolean.TRUE.equals(request.getIsLimitedDuration()));
        appointment.setNoShowMarkedByUser(null);
        appointment.setCreatedAt(now);
        appointment.setUpdatedAt(now);
        return appointment;
    }

    public AppointmentResponseDto toResponse(Appointment appointment) {
        return AppointmentResponseDto.builder()
                .appointmentId(appointment.getAppointmentId())
                .studentId(appointment.getStudent() != null ? appointment.getStudent().getUserId() : null)
                .staffId(appointment.getStaff() != null ? appointment.getStaff().getUserId() : null)
                .categoryId(appointment.getCategory() != null
                        ? appointment.getCategory().getCategoryId()
                        : null)
                .courseId(appointment.getCourse() != null ? appointment.getCourse().getCourseId() : null)
                .slotId(appointment.getSlot() != null ? appointment.getSlot().getSlotId() : null)
                .appointmentStatus(appointment.getAppointmentStatus())
                .meetingType(appointment.getMeetingType())
                .isLimitedDuration(Boolean.TRUE.equals(appointment.getIsLimitedDuration()))
                .createdAt(appointment.getCreatedAt())
                .updatedAt(appointment.getUpdatedAt())
                .build();
    }

    public AssistantAppointmentResponseDto toAssistantResponse(Appointment appointment) {
        return AssistantAppointmentResponseDto.builder()
                .appointmentId(appointment.getAppointmentId())
                .studentName(appointment.getStudent() != null
                        ? appointment.getStudent().getFullName()
                        : null)
                .appointmentDate(appointment.getSlot() != null
                        ? appointment.getSlot().getSlotDate()
                        : null)
                .startTime(appointment.getSlot() != null
                        ? appointment.getSlot().getStartTime()
                        : null)
                .endTime(appointment.getSlot() != null
                        ? appointment.getSlot().getEndTime()
                        : null)
                .categoryName(appointment.getCategory() != null
                        ? appointment.getCategory().getCategoryName()
                        : null)
                .courseCode(appointment.getCourse() != null
                        ? appointment.getCourse().getCourseCode()
                        : null)
                .courseName(appointment.getCourse() != null
                        ? appointment.getCourse().getCourseName()
                        : null)
                .meetingType(appointment.getMeetingType())
                .appointmentStatus(appointment.getAppointmentStatus())
                .build();
    }
}
