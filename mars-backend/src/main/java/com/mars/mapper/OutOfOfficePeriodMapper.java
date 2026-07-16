package com.mars.mapper;

import java.time.LocalDate;

import org.springframework.stereotype.Component;

import com.mars.dto.OutOfOfficePeriodCreateRequest;
import com.mars.dto.OutOfOfficePeriodResponseDto;
import com.mars.dto.OutOfOfficePeriodUpdateRequest;
import com.mars.entity.OutOfOfficePeriod;
import com.mars.entity.User;

@Component
public class OutOfOfficePeriodMapper {

    public OutOfOfficePeriod toEntity(OutOfOfficePeriodCreateRequest request, User staff) {
        OutOfOfficePeriod period = new OutOfOfficePeriod();
        period.setStaff(staff);
        period.setStartDate(request.getStartDate());
        period.setEndDate(request.getEndDate());
        period.setReasonCode(request.getReasonCode().trim().toUpperCase());
        return period;
    }

    public void updateEntity(OutOfOfficePeriod period, OutOfOfficePeriodUpdateRequest request) {
        period.setStartDate(request.getStartDate());
        period.setEndDate(request.getEndDate());
        period.setReasonCode(request.getReasonCode().trim().toUpperCase());
    }

    public void applyEnd(OutOfOfficePeriod period, LocalDate endDate) {
        period.setEndDate(endDate);
    }

    public OutOfOfficePeriodResponseDto toResponse(OutOfOfficePeriod period) {
        return OutOfOfficePeriodResponseDto.builder()
                .outOfOfficeId(period.getOutOfOfficeId())
                .startDate(period.getStartDate())
                .endDate(period.getEndDate())
                .reasonCode(period.getReasonCode())
                .build();
    }
}
