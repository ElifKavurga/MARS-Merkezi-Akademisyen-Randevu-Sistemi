package com.mars.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

import com.mars.config.CorsConfig;
import com.mars.dto.StudentAppointmentCategoryResponseDto;
import com.mars.exception.handler.GlobalExceptionHandler;
import com.mars.security.JwtAuthenticationFilter;
import com.mars.security.SecurityConfig;
import com.mars.security.SecurityErrorWriter;
import com.mars.security.SecurityMessages;
import com.mars.service.StudentAppointmentCategoryService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;

@WebMvcTest(controllers = StudentAppointmentCategoryController.class)
@Import({
        SecurityConfig.class,
        SecurityErrorWriter.class,
        CorsConfig.class,
        GlobalExceptionHandler.class
})
class StudentAppointmentCategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StudentAppointmentCategoryService studentAppointmentCategoryService;

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
    void listCategories_asStudent_returnsCategories() throws Exception {
        when(studentAppointmentCategoryService.listActiveCategories())
                .thenReturn(List.of(
                        StudentAppointmentCategoryResponseDto.builder()
                                .categoryId(1)
                                .categoryName("Ders Seçimi")
                                .description(null)
                                .durationMinutes(30)
                                .categoryGroup("COURSE_EXAM")
                                .requiresCourseSelection(true)
                                .build()));

        mockMvc.perform(get("/students/appointment-categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].categoryId").value(1))
                .andExpect(jsonPath("$[0].categoryName").value("Ders Seçimi"))
                .andExpect(jsonPath("$[0].durationMinutes").value(30))
                .andExpect(jsonPath("$[0].requiresCourseSelection").value(true));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "ACADEMICIAN", "ASSISTANT", "HOD"})
    void listCategories_nonStudent_returnsForbidden(String role) throws Exception {
        mockMvc.perform(get("/students/appointment-categories").with(user("user").roles(role)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value(SecurityMessages.ACCESS_DENIED));
    }

    @Test
    void listCategories_unauthenticated_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/students/appointment-categories"))
                .andExpect(status().isUnauthorized());
    }
}
