package com.mars.enums;

import java.util.EnumSet;
import java.util.Set;

public enum DelegationStatus {
    PENDING,
    PENDING_ACADEMICIAN_APPROVAL,
    PENDING_STUDENT_APPROVAL,
    ACCEPTED,
    REJECTED,
    STUDENT_REJECTED,
    EXPIRED,
    CANCELLED,
    COMPLETED;

    public boolean canTransitionTo(DelegationStatus target) {
        if (target == null || this == target) {
            return false;
        }
        return allowedTargets().contains(target);
    }

    private Set<DelegationStatus> allowedTargets() {
        return switch (this) {
            case PENDING -> EnumSet.of(
                    PENDING_STUDENT_APPROVAL, ACCEPTED, REJECTED, EXPIRED, CANCELLED);
            case PENDING_ACADEMICIAN_APPROVAL ->
                    EnumSet.of(PENDING_STUDENT_APPROVAL, REJECTED, EXPIRED, CANCELLED);
            case PENDING_STUDENT_APPROVAL ->
                    EnumSet.of(PENDING, PENDING_ACADEMICIAN_APPROVAL, ACCEPTED, REJECTED, EXPIRED, CANCELLED);
            case ACCEPTED -> EnumSet.of(CANCELLED, COMPLETED);
            case REJECTED, STUDENT_REJECTED, EXPIRED, CANCELLED, COMPLETED ->
                    EnumSet.noneOf(DelegationStatus.class);
        };
    }
}
