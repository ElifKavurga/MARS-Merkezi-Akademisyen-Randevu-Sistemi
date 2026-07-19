package com.mars.controller;

import static org.mockito.ArgumentMatchers.any;
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
import com.mars.dto.AssistantCourseResponseDto;
import com.mars.dto.AssistantDashboardResponseDto;
import com.mars.dto.StaffAppointmentResponseDto;
import com.mars.exception.handler.GlobalExceptionHandler;
import com.mars.security.JwtAuthenticationFilter;
import com.mars.security.SecurityConfig;
import com.mars.security.SecurityErrorWriter;
import com.mars.service.AssistantCourseService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;

@WebMvcTest(controllers = AssistantDashboardController.class)
@Import({
        SecurityConfig.class,
        SecurityErrorWriter.class,
        CorsConfig.class,
        GlobalExceptionHandler.class
})
class AssistantDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AssistantCourseService assistantCourseService;

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
    @WithMockUser(roles = "ASSISTANT")
    void getDashboardSummary_asAssistant_returnsRealSummary() throws Exception {
        when(assistantCourseService.getDashboardSummary()).thenReturn(
                AssistantDashboardResponseDto.builder()
                        .assignedCourseCount(2)
                        .relatedAcademicianCount(1)
                        .assignedCoursesPreview(List.of(
                                AssistantCourseResponseDto.builder()
                                        .courseId(1)
                                        .courseCode("BLM101")
                                        .courseName("Programlamaya Giriş")
                                        .academicTerm("2026-2027 Güz")
                                        .ownerAcademicianName("Dr. Akademisyen")
                                        .build()))
                        .pendingAppointmentCount(2)
                        .upcomingAppointmentCount(1)
                        .pendingDelegationCount(3)
                        .acceptedDelegationCount(4)
                        .rejectedDelegationCount(1)
                        .pendingAppointments(List.of(
                                StaffAppointmentResponseDto.builder()
                                        .appointmentId(11)
                                        .appointmentStatus("PENDING")
                                        .build()))
                        .upcomingAppointments(List.of(
                                StaffAppointmentResponseDto.builder()
                                        .appointmentId(12)
                                        .appointmentStatus("APPROVED")
                                        .build()))
                        .build());

        mockMvc.perform(get("/assistant/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedCourseCount").value(2))
                .andExpect(jsonPath("$.relatedAcademicianCount").value(1))
                .andExpect(jsonPath("$.assignedCoursesPreview[0].courseCode").value("BLM101"))
                .andExpect(jsonPath("$.pendingAppointmentCount").value(2))
                .andExpect(jsonPath("$.upcomingAppointmentCount").value(1))
                .andExpect(jsonPath("$.pendingDelegationCount").value(3))
                .andExpect(jsonPath("$.acceptedDelegationCount").value(4))
                .andExpect(jsonPath("$.rejectedDelegationCount").value(1))
                .andExpect(jsonPath("$.pendingAppointments[0].appointmentId").value(11))
                .andExpect(jsonPath("$.upcomingAppointments[0].appointmentId").value(12));

        verify(assistantCourseService).getDashboardSummary();
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void getDashboardSummary_asStudent_returnsForbidden() throws Exception {
        assertForbidden();
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void getDashboardSummary_asAcademician_returnsForbidden() throws Exception {
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
        mockMvc.perform(get("/assistant/dashboard"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }
}
