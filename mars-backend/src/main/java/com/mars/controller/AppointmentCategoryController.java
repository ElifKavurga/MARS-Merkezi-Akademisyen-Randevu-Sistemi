package com.mars.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.admin.AppointmentCategoryResponse;
import com.mars.service.AdminAppointmentCategoryService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class AppointmentCategoryController {

    private final AdminAppointmentCategoryService adminAppointmentCategoryService;

    @GetMapping
    public ResponseEntity<List<AppointmentCategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(adminAppointmentCategoryService.getAllCategories());
    }
}
