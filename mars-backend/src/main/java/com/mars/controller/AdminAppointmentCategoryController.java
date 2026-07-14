package com.mars.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.admin.AppointmentCategoryRequest;
import com.mars.dto.admin.AppointmentCategoryResponse;
import com.mars.service.AdminAppointmentCategoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/admin/categories")
@RequiredArgsConstructor
public class AdminAppointmentCategoryController {

    private final AdminAppointmentCategoryService adminAppointmentCategoryService;

    @GetMapping
    public ResponseEntity<List<AppointmentCategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(adminAppointmentCategoryService.getAllCategories());
    }

    @PostMapping
    public ResponseEntity<AppointmentCategoryResponse> createCategory(
            @Valid @RequestBody AppointmentCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminAppointmentCategoryService.createCategory(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AppointmentCategoryResponse> updateCategory(
            @PathVariable Integer id,
            @Valid @RequestBody AppointmentCategoryRequest request) {
        return ResponseEntity.ok(adminAppointmentCategoryService.updateCategory(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Integer id) {
        adminAppointmentCategoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
