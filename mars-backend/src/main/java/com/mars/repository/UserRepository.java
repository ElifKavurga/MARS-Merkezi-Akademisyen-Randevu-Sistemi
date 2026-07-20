package com.mars.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mars.entity.User;

public interface UserRepository extends JpaRepository<User, Integer> {

    @Query("SELECT u FROM User u JOIN FETCH u.role JOIN FETCH u.department WHERE u.institutionalEmail = :institutionalEmail")
    Optional<User> findByInstitutionalEmail(@Param("institutionalEmail") String institutionalEmail);

    @Query("SELECT u FROM User u JOIN FETCH u.role JOIN FETCH u.department ORDER BY u.userId ASC")
    List<User> findAllWithRoleAndDepartment();

    @Query("SELECT u FROM User u JOIN FETCH u.role JOIN FETCH u.department WHERE u.userId = :userId")
    Optional<User> findByIdWithRoleAndDepartment(@Param("userId") Integer userId);

    boolean existsByInstitutionalEmail(String institutionalEmail);

    boolean existsByInstitutionalEmailAndUserIdNot(String institutionalEmail, Integer userId);

    @Query("""
            SELECT u FROM User u
            JOIN FETCH u.role r
            JOIN FETCH u.department
            WHERE r.roleName = :roleName
              AND u.isActive = true
            ORDER BY u.fullName ASC
            """)
    List<User> findActiveUsersByRoleName(@Param("roleName") String roleName);

    @Query(
            value = """
                    SELECT u FROM User u
                    JOIN u.role r
                    JOIN u.department d
                    WHERE u.isActive = true
                      AND r.roleName IN :roleNames
                      AND (:departmentId IS NULL OR d.departmentId = :departmentId)
                      AND (:academicTitle IS NULL OR :academicTitle = '' OR u.academicTitle = :academicTitle)
                      AND (:isAcceptingAppointments IS NULL
                           OR u.isAcceptingAppointments = :isAcceptingAppointments)
                      AND (
                            :search IS NULL
                            OR :search = ''
                            OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                            OR LOWER(d.departmentName) LIKE LOWER(CONCAT('%', :search, '%'))
                          )
                    """,
            countQuery = """
                    SELECT COUNT(u) FROM User u
                    JOIN u.role r
                    JOIN u.department d
                    WHERE u.isActive = true
                      AND r.roleName IN :roleNames
                      AND (:departmentId IS NULL OR d.departmentId = :departmentId)
                      AND (:academicTitle IS NULL OR :academicTitle = '' OR u.academicTitle = :academicTitle)
                      AND (:isAcceptingAppointments IS NULL
                           OR u.isAcceptingAppointments = :isAcceptingAppointments)
                      AND (
                            :search IS NULL
                            OR :search = ''
                            OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                            OR LOWER(d.departmentName) LIKE LOWER(CONCAT('%', :search, '%'))
                          )
                    """)
    Page<User> searchActiveAcademicians(
            @Param("roleNames") Collection<String> roleNames,
            @Param("search") String search,
            @Param("departmentId") Integer departmentId,
            @Param("academicTitle") String academicTitle,
            @Param("isAcceptingAppointments") Boolean isAcceptingAppointments,
            Pageable pageable);

    @Query("""
            SELECT DISTINCT u.academicTitle FROM User u
            JOIN u.role r
            WHERE u.isActive = true
              AND r.roleName IN :roleNames
              AND u.academicTitle IS NOT NULL
              AND TRIM(u.academicTitle) <> ''
            ORDER BY u.academicTitle ASC
            """)
    List<String> findDistinctAcademicTitles(@Param("roleNames") Collection<String> roleNames);

    @Query("""
            SELECT u FROM User u
            JOIN FETCH u.role r
            JOIN FETCH u.department
            WHERE u.userId = :userId
              AND u.isActive = true
              AND r.roleName IN :roleNames
            """)
    Optional<User> findActiveAcademicianById(
            @Param("userId") Integer userId,
            @Param("roleNames") Collection<String> roleNames);
}
