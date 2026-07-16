package com.mars.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mars.entity.OutOfOfficePeriod;

public interface OutOfOfficePeriodRepository extends JpaRepository<OutOfOfficePeriod, Integer> {

    @Query("""
            SELECT p FROM OutOfOfficePeriod p
            WHERE p.staff.userId = :staffId
            ORDER BY p.startDate ASC, p.endDate ASC
            """)
    List<OutOfOfficePeriod> findByStaffIdOrderByStartDateAscEndDateAsc(@Param("staffId") Integer staffId);

    @Query("""
            SELECT p FROM OutOfOfficePeriod p
            JOIN FETCH p.staff
            WHERE p.outOfOfficeId = :outOfOfficeId
            """)
    Optional<OutOfOfficePeriod> findByIdWithStaff(@Param("outOfOfficeId") Integer outOfOfficeId);

    @Query("""
            SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END
            FROM OutOfOfficePeriod p
            WHERE p.staff.userId = :staffId
              AND p.startDate <= :endDate
              AND p.endDate >= :startDate
            """)
    boolean existsOverlappingPeriod(
            @Param("staffId") Integer staffId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
            SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END
            FROM OutOfOfficePeriod p
            WHERE p.staff.userId = :staffId
              AND p.outOfOfficeId <> :excludeId
              AND p.startDate <= :endDate
              AND p.endDate >= :startDate
            """)
    boolean existsOverlappingPeriodExcludingId(
            @Param("staffId") Integer staffId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeId") Integer excludeId);

    @Query("""
            SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END
            FROM OutOfOfficePeriod p
            WHERE p.staff.userId = :staffId
              AND p.outOfOfficeId <> :excludeId
              AND p.startDate <= :date
              AND p.endDate >= :date
            """)
    boolean existsOtherPeriodCoveringDate(
            @Param("staffId") Integer staffId,
            @Param("date") LocalDate date,
            @Param("excludeId") Integer excludeId);
}
