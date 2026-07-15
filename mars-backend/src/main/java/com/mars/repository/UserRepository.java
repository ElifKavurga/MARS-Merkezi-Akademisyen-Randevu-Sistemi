package com.mars.repository;

import java.util.List;
import java.util.Optional;

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
}
