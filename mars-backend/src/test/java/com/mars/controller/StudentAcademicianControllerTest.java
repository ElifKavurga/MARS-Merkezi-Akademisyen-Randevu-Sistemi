package com.mars.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import com.mars.StudentAcademicianMessages;
import com.mars.config.CorsConfig;
import com.mars.dto.AvailableSlotResponseDto;
import com.mars.dto.PageResponseDto;
import com.mars.dto.StudentAcademicianCourseDto;
import com.mars.dto.StudentAcademicianDetailResponseDto;
import com.mars.dto.StudentAcademicianResponseDto;
import com.mars.exception.BadRequestException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.exception.handler.GlobalExceptionHandler;
import com.mars.security.JwtAuthenticationFilter;
import com.mars.security.SecurityConfig;
import com.mars.security.SecurityErrorWriter;
import com.mars.security.SecurityMessages;
import com.mars.service.StudentAcademicianService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;

@WebMvcTest(controllers = StudentAcademicianController.class)
@Import({
        SecurityConfig.class,
        SecurityErrorWriter.class,
        CorsConfig.class,
        GlobalExceptionHandler.class
})
class StudentAcademicianControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StudentAcademicianService studentAcademicianService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @BeforeEach
    void configureJwtFilterPassthrough() throws Exception {
        doAnswer(invocation -> {
            ServletRequest request = invocation.getArgument(0);
            ServletResponse response = invocation.getArgument(1);
            FilterChain chain = invocation.getArgument(2);
            chain.doFilter(request, response);
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void searchAcademicians_asStudent_returnsPage() throws Exception {
        when(studentAcademicianService.searchAcademicians(
                        isNull(), isNull(), isNull(), isNull(), eq("NAME_ASC"), eq(0), eq(12)))
                .thenReturn(PageResponseDto.<StudentAcademicianResponseDto>builder()
                        .content(List.of(
                                StudentAcademicianResponseDto.builder()
                                        .userId(7)
                                        .fullName("Ayşe Yılmaz")
                                        .academicTitle("Doç. Dr.")
                                        .departmentName("Bilgisayar Mühendisliği")
                                        .institutionalEmail("ayse.yilmaz@mars.edu.tr")
                                        .isAcceptingAppointments(true)
                                        .profilePhotoUrl(null)
                                        .build()))
                        .page(0)
                        .size(12)
                        .totalElements(1)
                        .totalPages(1)
                        .first(true)
                        .last(true)
                        .build());

        mockMvc.perform(get("/students/academicians"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].userId").value(7))
                .andExpect(jsonPath("$.content[0].fullName").value("Ayşe Yılmaz"))
                .andExpect(jsonPath("$.content[0].academicTitle").value("Doç. Dr."))
                .andExpect(jsonPath("$.content[0].institutionalEmail").value("ayse.yilmaz@mars.edu.tr"))
                .andExpect(jsonPath("$.content[0].isAcceptingAppointments").value(true))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void searchAcademicians_withFilters_passesParams() throws Exception {
        when(studentAcademicianService.searchAcademicians(
                        eq("Yılmaz"),
                        eq(3),
                        eq("Prof. Dr."),
                        eq(true),
                        eq("NAME_DESC"),
                        eq(1),
                        eq(12)))
                .thenReturn(PageResponseDto.<StudentAcademicianResponseDto>builder()
                        .content(List.of())
                        .page(1)
                        .size(12)
                        .totalElements(0)
                        .totalPages(0)
                        .first(false)
                        .last(true)
                        .build());

        mockMvc.perform(get("/students/academicians")
                        .param("search", "Yılmaz")
                        .param("departmentId", "3")
                        .param("academicTitle", "Prof. Dr.")
                        .param("isAcceptingAppointments", "true")
                        .param("sort", "NAME_DESC")
                        .param("page", "1")
                        .param("size", "12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(0));

        verify(studentAcademicianService).searchAcademicians(
                "Yılmaz", 3, "Prof. Dr.", true, "NAME_DESC", 1, 12);
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void listAcademicTitles_asStudent_returnsTitles() throws Exception {
        when(studentAcademicianService.listAcademicTitles())
                .thenReturn(List.of("Doç. Dr.", "Prof. Dr."));

        mockMvc.perform(get("/students/academicians/titles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("Doç. Dr."))
                .andExpect(jsonPath("$[1]").value("Prof. Dr."));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void getAcademicianDetail_asStudent_returnsDetail() throws Exception {
        when(studentAcademicianService.getAcademicianDetail(7))
                .thenReturn(StudentAcademicianDetailResponseDto.builder()
                        .userId(7)
                        .fullName("Ayşe Yılmaz")
                        .academicTitle("Doç. Dr.")
                        .departmentName("Bilgisayar Mühendisliği")
                        .institutionalEmail("ayse.yilmaz@mars.edu.tr")
                        .isAcceptingAppointments(true)
                        .profilePhotoUrl(null)
                        .officeName(null)
                        .officeLocation(null)
                        .about(null)
                        .courses(List.of(
                                StudentAcademicianCourseDto.builder()
                                        .courseId(1)
                                        .courseCode("CENG101")
                                        .courseName("Programlamaya Giriş")
                                        .academicTerm("2025-2026 Güz")
                                        .build()))
                        .build());

        mockMvc.perform(get("/students/academicians/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(7))
                .andExpect(jsonPath("$.fullName").value("Ayşe Yılmaz"))
                .andExpect(jsonPath("$.isAcceptingAppointments").value(true))
                .andExpect(jsonPath("$.courses[0].courseCode").value("CENG101"));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void getAcademicianAvailability_asStudent_returnsSlots() throws Exception {
        when(studentAcademicianService.getAcademicianAvailability(7))
                .thenReturn(List.of(
                        AvailableSlotResponseDto.builder()
                                .slotId(11)
                                .staffId(7)
                                .staffName("Ayşe Yılmaz")
                                .slotDate(LocalDate.of(2026, 7, 21))
                                .startTime(LocalTime.of(14, 0))
                                .endTime(LocalTime.of(14, 30))
                                .meetingType("FACE_TO_FACE")
                                .build()));

        mockMvc.perform(get("/students/academicians/7/availability"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slotId").value(11))
                .andExpect(jsonPath("$[0].meetingType").value("FACE_TO_FACE"))
                .andExpect(jsonPath("$[0].startTime").value("14:00:00"));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void listAcademicianCourses_asStudent_returnsCourses() throws Exception {
        when(studentAcademicianService.listAcademicianCourses(7))
                .thenReturn(List.of(
                        StudentAcademicianCourseDto.builder()
                                .courseId(1)
                                .courseCode("CENG101")
                                .courseName("Programlamaya Giriş")
                                .academicTerm("2025-2026 Güz")
                                .build()));

        mockMvc.perform(get("/students/academicians/7/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].courseId").value(1))
                .andExpect(jsonPath("$[0].courseCode").value("CENG101"))
                .andExpect(jsonPath("$[0].courseName").value("Programlamaya Giriş"));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void listAvailableSlots_asStudent_returnsSlots() throws Exception {
        when(studentAcademicianService.listAvailableSlots(7, 3, null))
                .thenReturn(List.of(
                        AvailableSlotResponseDto.builder()
                                .slotId(11)
                                .staffId(7)
                                .slotDate(LocalDate.of(2026, 8, 15))
                                .startTime(LocalTime.of(9, 0))
                                .endTime(LocalTime.of(9, 30))
                                .meetingType("FACE_TO_FACE")
                                .build()));

        mockMvc.perform(get("/students/academicians/7/available-slots").param("categoryId", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slotId").value(11))
                .andExpect(jsonPath("$[0].slotDate").value("2026-08-15"))
                .andExpect(jsonPath("$[0].startTime").value("09:00:00"));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void listAcademicianCourses_asAcademician_returnsForbidden() throws Exception {
        mockMvc.perform(get("/students/academicians/7/courses"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void getAcademicianAvailability_asAcademician_returnsForbidden() throws Exception {
        mockMvc.perform(get("/students/academicians/7/availability"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void getAcademicianDetail_notFound_returnsStandardApiError() throws Exception {
        when(studentAcademicianService.getAcademicianDetail(99))
                .thenThrow(new ResourceNotFoundException(StudentAcademicianMessages.ACADEMICIAN_NOT_FOUND));

        mockMvc.perform(get("/students/academicians/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value(StudentAcademicianMessages.ACADEMICIAN_NOT_FOUND))
                .andExpect(jsonPath("$.path").value("/students/academicians/99"));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void getAcademicianAvailability_notFound_returnsStandardApiError() throws Exception {
        when(studentAcademicianService.getAcademicianAvailability(99))
                .thenThrow(new ResourceNotFoundException(StudentAcademicianMessages.ACADEMICIAN_NOT_FOUND));

        mockMvc.perform(get("/students/academicians/99/availability"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value(StudentAcademicianMessages.ACADEMICIAN_NOT_FOUND));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void searchAcademicians_invalidSort_returnsStandardBadRequest() throws Exception {
        when(studentAcademicianService.searchAcademicians(
                        isNull(), isNull(), isNull(), isNull(), eq("INVALID"), eq(0), eq(12)))
                .thenThrow(new BadRequestException(StudentAcademicianMessages.INVALID_SORT));

        mockMvc.perform(get("/students/academicians").param("sort", "INVALID"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(StudentAcademicianMessages.INVALID_SORT));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "ACADEMICIAN", "ASSISTANT", "HOD"})
    void studentAcademicianEndpoints_nonStudentRoles_returnForbidden(String role) throws Exception {
        mockMvc.perform(get("/students/academicians").with(user("user").roles(role)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value(SecurityMessages.ACCESS_DENIED));

        mockMvc.perform(get("/students/academicians/titles").with(user("user").roles(role)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/students/academicians/7").with(user("user").roles(role)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/students/academicians/7/availability").with(user("user").roles(role)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void getAcademicianDetail_asAcademician_returnsForbidden() throws Exception {
        mockMvc.perform(get("/students/academicians/7"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value(SecurityMessages.ACCESS_DENIED));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void searchAcademicians_asAcademician_returnsForbidden() throws Exception {
        mockMvc.perform(get("/students/academicians"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void searchAcademicians_asAdmin_returnsForbidden() throws Exception {
        mockMvc.perform(get("/students/academicians"))
                .andExpect(status().isForbidden());
    }

    @Test
    void searchAcademicians_unauthenticated_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/students/academicians"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(401));
    }
}
