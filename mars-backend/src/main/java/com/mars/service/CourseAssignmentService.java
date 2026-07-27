package com.mars.service;

import java.util.Objects;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.CourseAssignmentUpdateRequest;
import com.mars.dto.CourseAssistantResponseDto;
import com.mars.entity.Course;
import com.mars.entity.CourseAssignment;
import com.mars.entity.User;
import com.mars.enums.RoleType;
import com.mars.exception.BadRequestException;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.mapper.CourseAssignmentMapper;
import com.mars.repository.CourseAssignmentRepository;
import com.mars.repository.UserRepository;
import com.mars.security.CustomUserDetails;
import com.mars.security.SecurityMessages;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CourseAssignmentService {

    private final CourseAssignmentRepository courseAssignmentRepository;
    private final UserRepository userRepository;
    private final CourseAssignmentMapper courseAssignmentMapper;

    @Transactional
    public CourseAssistantResponseDto updateAssignment(Integer assignmentId, CourseAssignmentUpdateRequest request) {
        User currentUser = getCurrentUser();
        CourseAssignment assignment = getOwnedAssignment(
                assignmentId,
                currentUser,
                "Bu atamayı güncelleme yetkiniz yok.");

        User newAssistant = userRepository.findByIdWithRoleAndDepartment(request.getAssistantId())
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı."));

        if (!Boolean.TRUE.equals(newAssistant.getIsActive())) {
            throw new BadRequestException("Pasif kullanıcı se�ilemez.");
        }

        if (newAssistant.getRole() == null
                || !RoleType.ASSISTANT.name().equals(newAssistant.getRole().getRoleName())) {
            throw new BadRequestException("Yalnızca ASSISTANT rol�ndeki kullanıcılar atanabilir.");
        }

        Integer courseId = assignment.getCourse().getCourseId();
        if (Objects.equals(assignment.getAssistant().getUserId(), newAssistant.getUserId())
                || courseAssignmentRepository.existsByCourse_CourseIdAndAssistant_UserIdAndCourseAssignmentIdNot(
                        courseId, newAssistant.getUserId(), assignmentId)) {
            throw new ConflictException("Bu asistan bu derse zaten atanmış.");
        }

        assignment.setAssistant(newAssistant);
        CourseAssignment saved = courseAssignmentRepository.save(assignment);
        return courseAssignmentMapper.toAssistantResponse(saved);
    }

    @Transactional
    public void removeAssignment(Integer assignmentId) {
        User currentUser = getCurrentUser();
        CourseAssignment assignment = getOwnedAssignment(
                assignmentId,
                currentUser,
                "Bu atamayı kaldırma yetkiniz yok.");
        courseAssignmentRepository.delete(assignment);
    }

    private CourseAssignment getOwnedAssignment(Integer assignmentId, User currentUser, String accessDeniedMessage) {
        CourseAssignment assignment = courseAssignmentRepository.findByIdWithCourseAndOwner(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Atama bulunamadı."));

        Course course = assignment.getCourse();
        if (course == null
                || course.getOwnerAcademician() == null
                || !Objects.equals(course.getOwnerAcademician().getUserId(), currentUser.getUserId())) {
            throw new AccessDeniedException(accessDeniedMessage);
        }

        return assignment;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AccessDeniedException(SecurityMessages.ACCESS_DENIED);
        }
        return userDetails.getUser();
    }
}
