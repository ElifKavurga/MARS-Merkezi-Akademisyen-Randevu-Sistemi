erDiagram

    Role {
        int roleId PK
        varchar roleName
    }

    Department {
        int departmentId PK
        varchar departmentName
    }

    User {
        int userId PK
        varchar fullName
        varchar institutionalEmail UK
        varchar passwordHash
        int roleId FK
        int departmentId FK
        boolean isActive
        datetime createdAt
    }

    Course {
        int courseId PK
        varchar courseCode
        varchar courseName
        int departmentId FK
        varchar academicTerm
        int ownerAcademicianId FK
    }

    CourseAssignment {
        int courseAssignmentId PK
        int courseId FK
        int assistantId FK
        datetime assignedAt
    }

    AvailabilitySlot {
        int slotId PK
        int staffId FK
        date slotDate
        time startTime
        time endTime
        int recurrenceRuleId FK
        boolean isBlocked
    }

    RecurrenceRule {
        int recurrenceRuleId PK
        int staffId FK
        varchar repeatType
        int repeatCount
        date startDate
        date endDate
    }

    OutOfOfficePeriod {
        int outOfOfficeId PK
        int staffId FK
        date startDate
        date endDate
        varchar reasonCode
    }

    AppointmentCategory {
        int categoryId PK
        varchar categoryName
        int durationMinutes
        varchar categoryGroup
        boolean requiresCourseSelection
    }

    PenaltyRule {
        int penaltyRuleId PK
        int maxNoShowCount
        int banDurationDays
        boolean isActive
    }

    Appointment {
        int appointmentId PK
        int studentId FK
        int staffId FK
        int categoryId FK
        int courseId FK
        int slotId FK
        varchar appointmentStatus
        boolean isLimitedDuration
        int noShowMarkedByUserId FK
        datetime createdAt
        datetime updatedAt
    }

    DelegationLog {
        int delegationId PK
        int appointmentId FK
        int delegatedByUserId FK
        int delegatedToUserId FK
        datetime delegatedAt
    }

    StudentPenaltyStatus {
        int studentId PK, FK
        boolean isRestricted
        date restrictionStartDate
        date restrictionEndDate
        int totalNoShowCount
        int penaltyRuleId FK
    }

    WaitlistEntry {
        int waitlistEntryId PK
        int studentId FK
        int staffId FK
        int categoryId FK
        int courseId FK
        datetime requestedAt
        varchar waitlistStatus
    }

    Role ||--o{ User : "roleId"
    Department ||--o{ User : "departmentId"
    Department ||--o{ Course : "departmentId"
    User ||--o{ Course : "ownerAcademicianId"
    Course ||--o{ CourseAssignment : "courseId"
    User ||--o{ CourseAssignment : "assistantId"
    User ||--o{ AvailabilitySlot : "staffId"
    User ||--o{ RecurrenceRule : "staffId"
    RecurrenceRule ||--o{ AvailabilitySlot : "recurrenceRuleId"
    User ||--o{ OutOfOfficePeriod : "staffId"
    AppointmentCategory ||--o{ Appointment : "categoryId"
    Course ||--o{ Appointment : "courseId"
    AvailabilitySlot ||--o| Appointment : "slotId"
    User ||--o{ Appointment : "studentId"
    User ||--o{ Appointment : "staffId"
    User ||--o{ Appointment : "noShowMarkedByUserId"
    Appointment ||--o{ DelegationLog : "appointmentId"
    User ||--o{ DelegationLog : "delegatedByUserId"
    User ||--o{ DelegationLog : "delegatedToUserId"
    User ||--o| StudentPenaltyStatus : "studentId"
    PenaltyRule ||--o{ StudentPenaltyStatus : "penaltyRuleId"
    User ||--o{ WaitlistEntry : "studentId"
    User ||--o{ WaitlistEntry : "staffId"
    AppointmentCategory ||--o{ WaitlistEntry : "categoryId"
    Course ||--o{ WaitlistEntry : "courseId"