package com.mars.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "penalty_rule")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PenaltyRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "penalty_rule_id")
    private Integer penaltyRuleId;

    @Column(name = "max_no_show_count", nullable = false)
    private Integer maxNoShowCount;

    @Column(name = "ban_duration_days", nullable = false)
    private Integer banDurationDays;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;
}
