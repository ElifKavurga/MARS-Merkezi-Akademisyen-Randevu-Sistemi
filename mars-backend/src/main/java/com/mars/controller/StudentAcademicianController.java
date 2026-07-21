package com.mars.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.AvailableSlotResponseDto;
import com.mars.dto.PageResponseDto;
import com.mars.dto.StudentAcademicianCourseDto;
import com.mars.dto.StudentAcademicianDetailResponseDto;
import com.mars.dto.StudentAcademicianResponseDto;
import com.mars.service.StudentAcademicianService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/students/academicians")
@RequiredArgsConstructor
public class StudentAcademicianController {

    private final StudentAcademicianService studentAcademicianService;

    @GetMapping
    public ResponseEntity<PageResponseDto<StudentAcademicianResponseDto>> searchAcademicians(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer departmentId,
            @RequestParam(required = false) String academicTitle,
            @RequestParam(required = false) Boolean isAcceptingAppointments,
            @RequestParam(defaultValue = "NAME_ASC") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(
                studentAcademicianService.searchAcademicians(
                        search,
                        departmentId,
                        academicTitle,
                        isAcceptingAppointments,
                        sort,
                        page,
                        size));
    }

    @GetMapping("/titles")
    public ResponseEntity<List<String>> listAcademicTitles() {
        return ResponseEntity.ok(studentAcademicianService.listAcademicTitles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentAcademicianDetailResponseDto> getAcademicianDetail(
            @PathVariable("id") Integer id) {
        return ResponseEntity.ok(studentAcademicianService.getAcademicianDetail(id));
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<List<AvailableSlotResponseDto>> getAcademicianAvailability(
            @PathVariable("id") Integer id) {
        return ResponseEntity.ok(studentAcademicianService.getAcademicianAvailability(id));
    }

    @GetMapping("/{id}/courses")
    public ResponseEntity<List<StudentAcademicianCourseDto>> listAcademicianCourses(
            @PathVariable("id") Integer id) {
        return ResponseEntity.ok(studentAcademicianService.listAcademicianCourses(id));
    }

    @GetMapping("/{id}/available-slots")
    public ResponseEntity<List<AvailableSlotResponseDto>> listAvailableSlots(
            @PathVariable("id") Integer id,
            @RequestParam Integer categoryId,
            @RequestParam(required = false) Integer courseId,
            @RequestParam(required = false, defaultValue = "false") Boolean includeBooked) {
        if (Boolean.TRUE.equals(includeBooked)) {
            return ResponseEntity.ok(studentAcademicianService.listAvailableSlots(id, categoryId, courseId, true));
        } else {
            return ResponseEntity.ok(studentAcademicianService.listAvailableSlots(id, categoryId, courseId));
        }
    }
}
