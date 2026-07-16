package com.mars.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.AvailabilitySlotCreateRequest;
import com.mars.dto.AvailabilitySlotResponseDto;
import com.mars.service.AvailabilitySlotService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/availability-slots")
@RequiredArgsConstructor
public class AvailabilitySlotController {

    private final AvailabilitySlotService availabilitySlotService;

    @GetMapping("/my")
    public ResponseEntity<List<AvailabilitySlotResponseDto>> getMySlots() {
        return ResponseEntity.ok(availabilitySlotService.getMySlots());
    }

    @PostMapping
    public ResponseEntity<AvailabilitySlotResponseDto> createSlot(
            @Valid @RequestBody AvailabilitySlotCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(availabilitySlotService.createSlot(request));
    }
}
