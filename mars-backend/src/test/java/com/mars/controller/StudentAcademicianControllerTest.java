package com.mars.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import com.mars.config.CorsConfig;
import com.mars.dto.PageResponseDto;
import com.mars.dto.StudentAcademicianResponseDto;
import com.mars.exception.handler.GlobalExceptionHandler;
import com.mars.security.JwtAuthenticationFilter;
import com.mars.security.SecurityConfig;
import com.mars.security.SecurityErrorWriter;
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
                .andExpect(status().isUnauthorized());
    }
}
