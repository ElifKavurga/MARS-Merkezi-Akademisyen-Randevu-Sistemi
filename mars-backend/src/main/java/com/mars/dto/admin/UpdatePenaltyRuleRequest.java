package com.mars.dto.admin;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePenaltyRuleRequest {

    @NotNull(message = "Randevuya katılmama limiti zorunludur.")
    @Positive(message = "Randevuya katılmama limiti 0'dan büyük olmalıdır.")
    private Integer maxNoShowCount;

    @NotNull(message = "Ceza süresi zorunludur.")
    @Positive(message = "Ceza süresi 0'dan büyük olmalıdır.")
    private Integer banDurationDays;

    @NotNull(message = "Sistem aktiflik bilgisi zorunludur.")
    private Boolean isActive;
}
