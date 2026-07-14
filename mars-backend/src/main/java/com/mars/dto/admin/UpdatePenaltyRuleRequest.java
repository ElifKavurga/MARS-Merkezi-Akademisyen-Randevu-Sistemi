package com.mars.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePenaltyRuleRequest {

    private Integer maxNoShowCount;
    private Integer banDurationDays;
    private Boolean isActive;
}
