package com.mars.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.AppointmentCreateRequest;
import com.mars.dto.AppointmentResponseDto;
import com.mars.dto.AppointmentRescheduleResponse;
import com.mars.dto.StudentAppointmentResponseDto;
import com.mars.service.AppointmentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Öğrenci randevu oluşturma, aktif liste, detay ve iptal.
 * Başarı gövdesi FE uyumu için ham DTO döner; hatalar GlobalExceptionHandler ApiResponse ile.
 */
@RestController
@RequestMapping("/students/appointments")
@RequiredArgsConstructor
public class StudentAppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping
    public ResponseEntity<List<StudentAppointmentResponseDto>> getActiveAppointments() {
        return ResponseEntity.ok(appointmentService.getStudentActiveAppointments());
    }

    @GetMapping("/past")
    public ResponseEntity<List<StudentAppointmentResponseDto>> getPastAppointments() {
        return ResponseEntity.ok(appointmentService.getStudentPastAppointments());
    }

    @GetMapping("/{appointmentId}")
    public ResponseEntity<StudentAppointmentResponseDto> getAppointment(
            @PathVariable Integer appointmentId) {
        return ResponseEntity.ok(appointmentService.getStudentAppointment(appointmentId));
    }

    @PatchMapping("/{appointmentId}/cancel")
    public ResponseEntity<StudentAppointmentResponseDto> cancelAppointment(
            @PathVariable Integer appointmentId) {
        return ResponseEntity.ok(appointmentService.cancelStudentAppointment(appointmentId));
    }

    @GetMapping("/{appointmentId}/reschedule-request")
    public ResponseEntity<AppointmentRescheduleResponse> getPendingRescheduleRequest(
            @PathVariable Integer appointmentId) {
        return ResponseEntity.of(appointmentService.getPendingStudentReschedule(appointmentId));
    }

    @PatchMapping("/reschedule-requests/{requestId}/accept")
    public ResponseEntity<AppointmentRescheduleResponse> acceptRescheduleRequest(
            @PathVariable Integer requestId) {
        return ResponseEntity.ok(appointmentService.acceptStudentReschedule(requestId));
    }

    @PatchMapping("/reschedule-requests/{requestId}/reject")
    public ResponseEntity<AppointmentRescheduleResponse> rejectRescheduleRequest(
            @PathVariable Integer requestId) {
        return ResponseEntity.ok(appointmentService.rejectStudentReschedule(requestId));
    }

    @PostMapping
    public ResponseEntity<AppointmentResponseDto> createAppointment(
            @Valid @RequestBody AppointmentCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentService.createAppointment(request));
    }
}
