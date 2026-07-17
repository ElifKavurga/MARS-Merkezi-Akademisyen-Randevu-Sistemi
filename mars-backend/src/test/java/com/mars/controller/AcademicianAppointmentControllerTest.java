package com.mars.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalTime;
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
import com.mars.dto.StaffAppointmentResponseDto;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.MeetingType;
import com.mars.enums.RoleType;
import com.mars.exception.handler.GlobalExceptionHandler;
import com.mars.security.JwtAuthenticationFilter;
import com.mars.security.SecurityConfig;
import com.mars.security.SecurityErrorWriter;
import com.mars.service.AppointmentService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;

@WebMvcTest(controllers = AcademicianAppointmentController.class)
@Import({
        SecurityConfig.class,
        SecurityErrorWriter.class,
        CorsConfig.class,
        GlobalExceptionHandler.class
})
class AcademicianAppointmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AppointmentService appointmentService;

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
    void getAppointments_asAcademician_returnsOwnPendingAppointments() throws Exception {
        when(appointmentService.getStaffAppointments(
                AppointmentStatus.PENDING.name(), RoleType.ACADEMICIAN))
                .thenReturn(List.of(appointmentResponse(AppointmentStatus.PENDING)));

        mockMvc.perform(get("/academician/appointments").param("status", "PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].appointmentId").value(11))
                .andExpect(jsonPath("$[0].studentName").value("Öğrenci Test"))
                .andExpect(jsonPath("$[0].courseCode").isEmpty())
                .andExpect(jsonPath("$[0].meetingType").value("ONLINE"));

        verify(appointmentService).getStaffAppointments(
                AppointmentStatus.PENDING.name(), RoleType.ACADEMICIAN);
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void getAppointments_asAcademician_withoutFilter_returnsAll() throws Exception {
        when(appointmentService.getStaffAppointments(null, RoleType.ACADEMICIAN))
                .thenReturn(List.of(appointmentResponse(AppointmentStatus.APPROVED)));

        mockMvc.perform(get("/academician/appointments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].appointmentStatus").value("APPROVED"));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void getAppointment_asAcademician_returnsOwnedDetail() throws Exception {
        when(appointmentService.getStaffAppointment(11, RoleType.ACADEMICIAN))
                .thenReturn(appointmentResponse(AppointmentStatus.PENDING));

        mockMvc.perform(get("/academician/appointments/11"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appointmentId").value(11));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void approveAppointment_asAcademician_returnsApproved() throws Exception {
        when(appointmentService.approveStaffAppointment(11, RoleType.ACADEMICIAN))
                .thenReturn(appointmentResponse(AppointmentStatus.APPROVED));

        mockMvc.perform(patch("/academician/appointments/11/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appointmentStatus").value("APPROVED"))
                .andExpect(jsonPath("$.meetingType").value("ONLINE"));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void rejectAppointment_asAcademician_returnsRejected() throws Exception {
        when(appointmentService.rejectStaffAppointment(11, RoleType.ACADEMICIAN))
                .thenReturn(appointmentResponse(AppointmentStatus.REJECTED));

        mockMvc.perform(patch("/academician/appointments/11/reject"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appointmentStatus").value("REJECTED"));
    }

    @Test
    @WithMockUser(roles = "ASSISTANT")
    void getAppointments_asAssistant_returnsForbidden() throws Exception {
        assertForbidden("GET", "/academician/appointments");
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void approveAppointment_asStudent_returnsForbidden() throws Exception {
        assertForbidden("PATCH", "/academician/appointments/11/approve");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAppointments_asAdmin_returnsForbidden() throws Exception {
        assertForbidden("GET", "/academician/appointments");
    }

    @Test
    @WithMockUser(roles = "HOD")
    void rejectAppointment_asHod_returnsForbidden() throws Exception {
        assertForbidden("PATCH", "/academician/appointments/11/reject");
    }

    private void assertForbidden(String method, String path) throws Exception {
        if ("GET".equals(method)) {
            mockMvc.perform(get(path))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403));
            return;
        }
        mockMvc.perform(patch(path))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    private StaffAppointmentResponseDto appointmentResponse(AppointmentStatus status) {
        return StaffAppointmentResponseDto.builder()
                .appointmentId(11)
                .studentName("Öğrenci Test")
                .appointmentDate(LocalDate.of(2026, 7, 20))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 10))
                .categoryName("Akademik Danışmanlık")
                .courseCode(null)
                .courseName(null)
                .meetingType(MeetingType.ONLINE.name())
                .appointmentStatus(status.name())
                .build();
    }
}
