package com.mars.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.StaffAppointmentResponseDto;
import com.mars.enums.RoleType;
import com.mars.service.AppointmentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/academician/appointments")
@RequiredArgsConstructor
public class AcademicianAppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping
    public ResponseEntity<List<StaffAppointmentResponseDto>> getAppointments(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(
                appointmentService.getStaffAppointments(status, RoleType.ACADEMICIAN));
    }

    @GetMapping("/{appointmentId}")
    public ResponseEntity<StaffAppointmentResponseDto> getAppointment(
            @PathVariable Integer appointmentId) {
        return ResponseEntity.ok(
                appointmentService.getStaffAppointment(appointmentId, RoleType.ACADEMICIAN));
    }

    @PatchMapping("/{appointmentId}/approve")
    public ResponseEntity<StaffAppointmentResponseDto> approveAppointment(
            @PathVariable Integer appointmentId) {
        return ResponseEntity.ok(
                appointmentService.approveStaffAppointment(
                        appointmentId, RoleType.ACADEMICIAN));
    }

    @PatchMapping("/{appointmentId}/reject")
    public ResponseEntity<StaffAppointmentResponseDto> rejectAppointment(
            @PathVariable Integer appointmentId) {
        return ResponseEntity.ok(
                appointmentService.rejectStaffAppointment(
                        appointmentId, RoleType.ACADEMICIAN));
    }
}
