package com.mars.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PenaltyRuleResponse {

    private Integer penaltyRuleId;
    private Integer maxNoShowCount;
    private Integer banDurationDays;
    private Boolean isActive;
}
