package com.mars.service;

import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mars.dto.PageResponseDto;
import com.mars.dto.StudentAcademicianResponseDto;
import com.mars.entity.User;
import com.mars.enums.RoleType;
import com.mars.exception.BadRequestException;
import com.mars.mapper.UserMapper;
import com.mars.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StudentAcademicianService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final String SORT_NAME_ASC = "NAME_ASC";
    private static final String SORT_NAME_DESC = "NAME_DESC";

    private static final List<String> ACADEMICIAN_ROLE_NAMES = List.of(
            RoleType.ACADEMICIAN.name(),
            RoleType.HOD.name());

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public PageResponseDto<StudentAcademicianResponseDto> searchAcademicians(
            String search,
            Integer departmentId,
            String academicTitle,
            Boolean isAcceptingAppointments,
            String sort,
            int page,
            int size) {
        if (page < 0) {
            throw new BadRequestException("Sayfa numarası 0 veya daha büyük olmalıdır.");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new BadRequestException("Sayfa boyutu 1 ile " + MAX_PAGE_SIZE + " arasında olmalıdır.");
        }

        String normalizedSearch = blankToNull(search);
        String normalizedTitle = blankToNull(academicTitle);
        Sort nameSort = resolveSort(sort);
        Pageable pageable = PageRequest.of(page, size, nameSort);

        Page<User> result = userRepository.searchActiveAcademicians(
                ACADEMICIAN_ROLE_NAMES,
                normalizedSearch,
                departmentId,
                normalizedTitle,
                isAcceptingAppointments,
                pageable);

        List<StudentAcademicianResponseDto> content = result.getContent().stream()
                .map(userMapper::toStudentAcademicianResponse)
                .toList();

        return PageResponseDto.<StudentAcademicianResponseDto>builder()
                .content(content)
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .first(result.isFirst())
                .last(result.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public List<String> listAcademicTitles() {
        return userRepository.findDistinctAcademicTitles(ACADEMICIAN_ROLE_NAMES);
    }

    private static Sort resolveSort(String sort) {
        String normalized = sort == null || sort.isBlank()
                ? SORT_NAME_ASC
                : sort.trim().toUpperCase(Locale.ROOT);
        if (SORT_NAME_DESC.equals(normalized)) {
            return Sort.by(Sort.Direction.DESC, "fullName");
        }
        if (SORT_NAME_ASC.equals(normalized)) {
            return Sort.by(Sort.Direction.ASC, "fullName");
        }
        throw new BadRequestException("Geçersiz sıralama değeri. NAME_ASC veya NAME_DESC kullanın.");
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
