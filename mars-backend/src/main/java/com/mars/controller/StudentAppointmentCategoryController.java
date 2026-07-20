package com.mars.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.StudentAppointmentCategoryResponseDto;
import com.mars.service.StudentAppointmentCategoryService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/students/appointment-categories")
@RequiredArgsConstructor
public class StudentAppointmentCategoryController {

    private final StudentAppointmentCategoryService studentAppointmentCategoryService;

    @GetMapping
    public ResponseEntity<List<StudentAppointmentCategoryResponseDto>> listCategories() {
        return ResponseEntity.ok(studentAppointmentCategoryService.listActiveCategories());
    }
}
