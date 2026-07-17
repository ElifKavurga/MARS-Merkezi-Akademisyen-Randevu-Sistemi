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
import com.mars.dto.AssistantAppointmentResponseDto;
import com.mars.enums.AppointmentStatus;
import com.mars.enums.MeetingType;
import com.mars.exception.handler.GlobalExceptionHandler;
import com.mars.security.JwtAuthenticationFilter;
import com.mars.security.SecurityConfig;
import com.mars.security.SecurityErrorWriter;
import com.mars.service.AppointmentService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;

@WebMvcTest(controllers = AssistantAppointmentController.class)
@Import({
        SecurityConfig.class,
        SecurityErrorWriter.class,
        CorsConfig.class,
        GlobalExceptionHandler.class
})
class AssistantAppointmentControllerTest {

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
    @WithMockUser(roles = "ASSISTANT")
    void getAppointments_asAssistant_returnsOwnPendingAppointments() throws Exception {
        when(appointmentService.getAssistantAppointments(AppointmentStatus.PENDING.name()))
                .thenReturn(List.of(appointmentResponse()));

        mockMvc.perform(get("/assistant/appointments")
                        .param("status", AppointmentStatus.PENDING.name()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].appointmentId").value(11))
                .andExpect(jsonPath("$[0].studentName").value("Öğrenci Test"))
                .andExpect(jsonPath("$[0].appointmentStatus").value("PENDING"))
                .andExpect(jsonPath("$[0].meetingType").value("FACE_TO_FACE"));

        verify(appointmentService).getAssistantAppointments(AppointmentStatus.PENDING.name());
    }

    @Test
    @WithMockUser(roles = "ASSISTANT")
    void getAppointments_asAssistant_withoutFilter_returnsAll() throws Exception {
        when(appointmentService.getAssistantAppointments(null))
                .thenReturn(List.of(appointmentResponse()));

        mockMvc.perform(get("/assistant/appointments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(roles = "ASSISTANT")
    void getAppointment_asAssistant_returnsOwnedDetail() throws Exception {
        when(appointmentService.getAssistantAppointment(11)).thenReturn(appointmentResponse());

        mockMvc.perform(get("/assistant/appointments/11"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appointmentId").value(11))
                .andExpect(jsonPath("$.courseCode").isEmpty());

        verify(appointmentService).getAssistantAppointment(11);
    }

    @Test
    @WithMockUser(roles = "ASSISTANT")
    void approveAppointment_asAssistant_returnsApproved() throws Exception {
        when(appointmentService.approveAssistantAppointment(11))
                .thenReturn(appointmentResponse(AppointmentStatus.APPROVED));

        mockMvc.perform(patch("/assistant/appointments/11/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appointmentId").value(11))
                .andExpect(jsonPath("$.appointmentStatus").value("APPROVED"))
                .andExpect(jsonPath("$.meetingType").value("FACE_TO_FACE"));

        verify(appointmentService).approveAssistantAppointment(11);
    }

    @Test
    @WithMockUser(roles = "ASSISTANT")
    void rejectAppointment_asAssistant_returnsRejected() throws Exception {
        when(appointmentService.rejectAssistantAppointment(11))
                .thenReturn(appointmentResponse(AppointmentStatus.REJECTED));

        mockMvc.perform(patch("/assistant/appointments/11/reject"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appointmentStatus").value("REJECTED"));

        verify(appointmentService).rejectAssistantAppointment(11);
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void getAppointments_asStudent_returnsForbidden() throws Exception {
        assertListForbidden();
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void getAppointments_asAcademician_returnsForbidden() throws Exception {
        assertListForbidden();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAppointments_asAdmin_returnsForbidden() throws Exception {
        assertListForbidden();
    }

    @Test
    @WithMockUser(roles = "HOD")
    void getAppointments_asHod_returnsForbidden() throws Exception {
        assertListForbidden();
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void getAppointmentDetail_asAcademician_returnsForbidden() throws Exception {
        mockMvc.perform(get("/assistant/appointments/11"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void approveAppointment_asStudent_returnsForbidden() throws Exception {
        assertPatchForbidden("/assistant/appointments/11/approve");
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void rejectAppointment_asAcademician_returnsForbidden() throws Exception {
        assertPatchForbidden("/assistant/appointments/11/reject");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void approveAppointment_asAdmin_returnsForbidden() throws Exception {
        assertPatchForbidden("/assistant/appointments/11/approve");
    }

    @Test
    @WithMockUser(roles = "HOD")
    void rejectAppointment_asHod_returnsForbidden() throws Exception {
        assertPatchForbidden("/assistant/appointments/11/reject");
    }

    private void assertListForbidden() throws Exception {
        mockMvc.perform(get("/assistant/appointments"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    private void assertPatchForbidden(String path) throws Exception {
        mockMvc.perform(patch(path))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    private AssistantAppointmentResponseDto appointmentResponse() {
        return appointmentResponse(AppointmentStatus.PENDING);
    }

    private AssistantAppointmentResponseDto appointmentResponse(AppointmentStatus status) {
        return AssistantAppointmentResponseDto.builder()
                .appointmentId(11)
                .studentName("Öğrenci Test")
                .appointmentDate(LocalDate.of(2026, 7, 20))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 10))
                .categoryName("Akademik Danışmanlık")
                .courseCode(null)
                .courseName(null)
                .meetingType(MeetingType.FACE_TO_FACE.name())
                .appointmentStatus(status.name())
                .build();
    }
}
