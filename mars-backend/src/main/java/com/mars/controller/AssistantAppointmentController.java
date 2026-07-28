package com.mars.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.AppointmentRescheduleRequest;
import com.mars.dto.AppointmentRescheduleResponse;
import com.mars.dto.AvailableSlotResponseDto;
import com.mars.dto.StaffAppointmentResponseDto;
import com.mars.enums.RoleType;
import com.mars.service.AppointmentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/assistant/appointments")
@RequiredArgsConstructor
public class AssistantAppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping
    public ResponseEntity<List<StaffAppointmentResponseDto>> getAppointments(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(
                appointmentService.getStaffAppointments(status, RoleType.ASSISTANT));
    }

    @GetMapping("/{appointmentId}")
    public ResponseEntity<StaffAppointmentResponseDto> getAppointment(
            @PathVariable Integer appointmentId) {
        return ResponseEntity.ok(
                appointmentService.getStaffAppointment(appointmentId, RoleType.ASSISTANT));
    }

    @PatchMapping("/{appointmentId}/approve")
    public ResponseEntity<StaffAppointmentResponseDto> approveAppointment(
            @PathVariable Integer appointmentId) {
        return ResponseEntity.ok(
                appointmentService.approveStaffAppointment(appointmentId, RoleType.ASSISTANT));
    }

    @PatchMapping("/{appointmentId}/reject")
    public ResponseEntity<StaffAppointmentResponseDto> rejectAppointment(
            @PathVariable Integer appointmentId) {
        return ResponseEntity.ok(
                appointmentService.rejectStaffAppointment(appointmentId, RoleType.ASSISTANT));
    }

    @PatchMapping("/{appointmentId}/complete")
    public ResponseEntity<StaffAppointmentResponseDto> completeAppointment(
            @PathVariable Integer appointmentId) {
        return ResponseEntity.ok(
                appointmentService.completeStaffAppointment(appointmentId, RoleType.ASSISTANT));
    }

    @PatchMapping("/{appointmentId}/no-show")
    public ResponseEntity<StaffAppointmentResponseDto> markAppointmentNoShow(
            @PathVariable Integer appointmentId) {
        return ResponseEntity.ok(
                appointmentService.markStaffAppointmentNoShow(appointmentId, RoleType.ASSISTANT));
    }

    @GetMapping("/{appointmentId}/reschedule-slots")
    public ResponseEntity<List<AvailableSlotResponseDto>> getRescheduleSlots(
            @PathVariable Integer appointmentId) {
        return ResponseEntity.ok(
                appointmentService.getStaffAppointmentRescheduleSlots(
                        appointmentId, RoleType.ASSISTANT));
    }

    @PatchMapping("/{appointmentId}/reschedule")
    public ResponseEntity<AppointmentRescheduleResponse> rescheduleAppointment(
            @PathVariable Integer appointmentId,
            @Valid @RequestBody AppointmentRescheduleRequest request) {
        return ResponseEntity.ok(
                appointmentService.rescheduleStaffAppointment(
                        appointmentId, request, RoleType.ASSISTANT));
    }
}
