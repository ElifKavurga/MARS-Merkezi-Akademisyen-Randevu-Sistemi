package com.mars.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import com.mars.dto.StudentAcademicianCourseDto;
import com.mars.dto.StudentAcademicianDetailResponseDto;
import com.mars.dto.StudentAcademicianResponseDto;
import com.mars.dto.UserOptionResponseDto;
import com.mars.dto.admin.UpdateUserRequest;
import com.mars.dto.admin.UserListResponse;
import com.mars.dto.admin.UserResponse;
import com.mars.entity.Course;
import com.mars.entity.Department;
import com.mars.entity.Role;
import com.mars.entity.User;

@Component
public class UserMapper {

    public UserListResponse toUserListResponse(User user) {
        return UserListResponse.builder()
                .userId(user.getUserId())
                .fullName(user.getDisplayName())
                .institutionalEmail(user.getInstitutionalEmail())
                .role(user.getRole().getRoleName())
                .department(user.getDepartment().getDepartmentName())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public UserOptionResponseDto toUserOptionResponse(User user) {
        return UserOptionResponseDto.builder()
                .userId(user.getUserId())
                .fullName(user.getDisplayName())
                .institutionalEmail(user.getInstitutionalEmail())
                .departmentName(user.getDepartment().getDepartmentName())
                .build();
    }

    public StudentAcademicianResponseDto toStudentAcademicianResponse(User user) {
        return StudentAcademicianResponseDto.builder()
                .userId(user.getUserId())
                .fullName(user.getDisplayName())
                .academicTitle(user.getAcademicTitle())
                .departmentName(user.getDepartment().getDepartmentName())
                .institutionalEmail(user.getInstitutionalEmail())
                .isAcceptingAppointments(Boolean.TRUE.equals(user.getIsAcceptingAppointments()))
                .profilePhotoUrl(null)
                .build();
    }

    public StudentAcademicianCourseDto toStudentAcademicianCourse(Course course) {
        return StudentAcademicianCourseDto.builder()
                .courseId(course.getCourseId())
                .courseCode(course.getCourseCode())
                .courseName(course.getCourseName())
                .academicTerm(course.getAcademicTerm())
                .build();
    }

    public StudentAcademicianDetailResponseDto toStudentAcademicianDetail(
            User user,
            List<StudentAcademicianCourseDto> courses) {
        return StudentAcademicianDetailResponseDto.builder()
                .userId(user.getUserId())
                .fullName(user.getDisplayName())
                .academicTitle(user.getAcademicTitle())
                .departmentName(user.getDepartment().getDepartmentName())
                .institutionalEmail(user.getInstitutionalEmail())
                .isAcceptingAppointments(Boolean.TRUE.equals(user.getIsAcceptingAppointments()))
                .profilePhotoUrl(null)
                .officeName(null)
                .officeLocation(null)
                .about(null)
                .courses(courses)
                .build();
    }

    public UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .fullName(user.getDisplayName())
                .institutionalEmail(user.getInstitutionalEmail())
                .role(user.getRole().getRoleName())
                .department(user.getDepartment().getDepartmentName())
                .isActive(user.getIsActive())
                .build();
    }

    public void updateUserFromRequest(User user, UpdateUserRequest request, Role role, Department department) {
        user.setFullName(request.getFullName());
        user.setInstitutionalEmail(request.getInstitutionalEmail());
        user.setRole(role);
        user.setDepartment(department);
    }
}
