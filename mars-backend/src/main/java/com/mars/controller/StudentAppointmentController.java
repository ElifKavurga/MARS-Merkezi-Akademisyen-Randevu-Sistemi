package com.mars.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.AppointmentCreateRequest;
import com.mars.dto.AppointmentResponseDto;
import com.mars.dto.StudentAppointmentResponseDto;
import com.mars.service.AppointmentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Öğrenci randevu oluşturma ve aktif randevu listesi.
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

    @PostMapping
    public ResponseEntity<AppointmentResponseDto> createAppointment(
            @Valid @RequestBody AppointmentCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentService.createAppointment(request));
    }
}
