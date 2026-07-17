package com.mars.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.AssistantAppointmentResponseDto;
import com.mars.service.AppointmentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/assistant/appointments")
@RequiredArgsConstructor
public class AssistantAppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping
    public ResponseEntity<List<AssistantAppointmentResponseDto>> getAppointments(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(appointmentService.getAssistantAppointments(status));
    }

    @GetMapping("/{appointmentId}")
    public ResponseEntity<AssistantAppointmentResponseDto> getAppointment(
            @PathVariable Integer appointmentId) {
        return ResponseEntity.ok(appointmentService.getAssistantAppointment(appointmentId));
    }

    @PatchMapping("/{appointmentId}/approve")
    public ResponseEntity<AssistantAppointmentResponseDto> approveAppointment(
            @PathVariable Integer appointmentId) {
        return ResponseEntity.ok(appointmentService.approveAssistantAppointment(appointmentId));
    }

    @PatchMapping("/{appointmentId}/reject")
    public ResponseEntity<AssistantAppointmentResponseDto> rejectAppointment(
            @PathVariable Integer appointmentId) {
        return ResponseEntity.ok(appointmentService.rejectAssistantAppointment(appointmentId));
    }
}
