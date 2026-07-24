package com.mars.repository;

import com.mars.entity.WaitlistEntry;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WaitlistEntryRepository extends JpaRepository<WaitlistEntry, Integer> {

    @Query("""
        SELECT w FROM WaitlistEntry w
        WHERE w.staff.userId = :staffId
          AND w.waitlistStatus = 'WAITING'
        ORDER BY w.requestedAt ASC
    """)
    List<WaitlistEntry> findActiveWaitlistEntriesForStaff(
        @Param("staffId") Integer staffId,
        Pageable pageable
    );

    @Query("""
        SELECT COUNT(w) > 0 FROM WaitlistEntry w
        WHERE w.slot.slotId = :slotId
          AND w.waitlistStatus = 'NOTIFIED'
          AND w.offeredAt >= :cutoffTime
    """)
    boolean existsActiveOfferForSlot(
        @Param("slotId") Integer slotId,
        @Param("cutoffTime") LocalDateTime cutoffTime
    );

    @Query("""
        SELECT w FROM WaitlistEntry w
        WHERE w.waitlistStatus = :status
          AND w.offeredAt < :cutoff
    """)
    List<WaitlistEntry> findExpiredOffers(
        @Param("status") String status,
        @Param("cutoff") LocalDateTime cutoff
    );

    long countByStaff_Department_DepartmentId(Integer departmentId);

    long countByStaff_Department_DepartmentIdAndWaitlistStatus(Integer departmentId, String waitlistStatus);

    @Query("""
        SELECT w.category.categoryName, COUNT(w)
        FROM WaitlistEntry w
        WHERE w.staff.department.departmentId = :departmentId
        GROUP BY w.category.categoryName
        ORDER BY COUNT(w) DESC
    """)
    List<Object[]> countByCategoryForDepartment(@Param("departmentId") Integer departmentId);
}
