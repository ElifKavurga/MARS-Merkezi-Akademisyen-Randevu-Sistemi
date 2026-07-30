package com.mars.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "student_penalty_status")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StudentPenaltyStatus implements Persistable<Integer> {

    @Id
    @Column(name = "student_id")
    private Integer studentId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "student_id")
    private User student;

    @Column(name = "is_restricted", nullable = false)
    private Boolean isRestricted;

    @Column(name = "restriction_start_date")
    private LocalDate restrictionStartDate;

    @Column(name = "restriction_end_date")
    private LocalDate restrictionEndDate;

    @Column(name = "total_no_show_count", nullable = false)
    private Integer totalNoShowCount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "penalty_rule_id", nullable = false)
    private PenaltyRule penaltyRule;

    @Transient
    private boolean newRecord;

    @Override
    public Integer getId() {
        return studentId;
    }

    @Override
    public boolean isNew() {
        return newRecord;
    }

    public void markNew() {
        this.newRecord = true;
    }
}
