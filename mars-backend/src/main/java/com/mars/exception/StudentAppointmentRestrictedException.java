package com.mars.exception;

import com.mars.AppointmentMessages;
import com.mars.dto.StudentAppointmentRestrictionResponse;

public class StudentAppointmentRestrictedException extends ConflictException {

    private final StudentAppointmentRestrictionResponse restriction;

    public StudentAppointmentRestrictedException(StudentAppointmentRestrictionResponse restriction) {
        super(AppointmentMessages.STUDENT_RESTRICTED);
        this.restriction = restriction;
    }

    public StudentAppointmentRestrictionResponse getRestriction() {
        return restriction;
    }
}
