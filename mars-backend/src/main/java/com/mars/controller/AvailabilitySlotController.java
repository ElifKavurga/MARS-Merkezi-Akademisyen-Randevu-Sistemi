package com.mars.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mars.dto.AvailabilitySlotResponseDto;
import com.mars.service.AvailabilitySlotService;

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
}
