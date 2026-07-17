package com.mars.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
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
import com.mars.dto.AcademicianDashboardResponseDto;
import com.mars.exception.handler.GlobalExceptionHandler;
import com.mars.security.JwtAuthenticationFilter;
import com.mars.security.SecurityConfig;
import com.mars.security.SecurityErrorWriter;
import com.mars.service.AcademicianDashboardService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;

@WebMvcTest(controllers = AcademicianDashboardController.class)
@Import({
        SecurityConfig.class,
        SecurityErrorWriter.class,
        CorsConfig.class,
        GlobalExceptionHandler.class
})
class AcademicianDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AcademicianDashboardService academicianDashboardService;

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
    @WithMockUser(roles = "ACADEMICIAN")
    void getDashboardSummary_asAcademician_returnsSummary() throws Exception {
        when(academicianDashboardService.getDashboardSummary()).thenReturn(
                AcademicianDashboardResponseDto.builder()
                        .pendingAppointmentCount(2)
                        .upcomingAppointmentCount(1)
                        .activeCourseCount(3)
                        .pendingAppointments(List.of())
                        .upcomingAppointments(List.of())
                        .build());

        mockMvc.perform(get("/academician/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pendingAppointmentCount").value(2))
                .andExpect(jsonPath("$.upcomingAppointmentCount").value(1))
                .andExpect(jsonPath("$.activeCourseCount").value(3))
                .andExpect(jsonPath("$.pendingAppointments").isArray())
                .andExpect(jsonPath("$.upcomingAppointments").isArray());
    }

    @Test
    @WithMockUser(roles = "ASSISTANT")
    void getDashboardSummary_asAssistant_returnsForbidden() throws Exception {
        assertForbidden();
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void getDashboardSummary_asStudent_returnsForbidden() throws Exception {
        assertForbidden();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getDashboardSummary_asAdmin_returnsForbidden() throws Exception {
        assertForbidden();
    }

    @Test
    @WithMockUser(roles = "HOD")
    void getDashboardSummary_asHod_returnsForbidden() throws Exception {
        assertForbidden();
    }

    private void assertForbidden() throws Exception {
        mockMvc.perform(get("/academician/dashboard"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }
}
