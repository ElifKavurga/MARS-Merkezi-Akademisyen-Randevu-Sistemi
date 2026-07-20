package com.mars.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mars.config.CorsConfig;
import com.mars.dto.AppointmentCreateRequest;
import com.mars.dto.AppointmentResponseDto;
import com.mars.dto.StudentAppointmentResponseDto;
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

@WebMvcTest(controllers = StudentAppointmentController.class)
@Import({
        SecurityConfig.class,
        SecurityErrorWriter.class,
        CorsConfig.class,
        GlobalExceptionHandler.class
})
class StudentAppointmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AppointmentService appointmentService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @BeforeEach
    void passThroughJwtFilter() throws Exception {
        doAnswer(invocation -> {
            FilterChain chain = invocation.getArgument(2);
            ServletRequest request = invocation.getArgument(0);
            ServletResponse response = invocation.getArgument(1);
            chain.doFilter(request, response);
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void getActiveAppointments_asStudent_returnsOk() throws Exception {
        StudentAppointmentResponseDto item = StudentAppointmentResponseDto.builder()
                .appointmentId(42)
                .staffId(5)
                .staffName("Dr. Ayşe Yılmaz")
                .academicTitle("Doç. Dr.")
                .departmentName("Bilgisayar Mühendisliği")
                .appointmentDate(LocalDate.of(2026, 7, 22))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .categoryName("Danışmanlık")
                .courseId(null)
                .courseCode(null)
                .courseName(null)
                .meetingType(MeetingType.FACE_TO_FACE.name())
                .appointmentStatus(AppointmentStatus.PENDING.name())
                .build();
        when(appointmentService.getStudentActiveAppointments()).thenReturn(List.of(item));

        mockMvc.perform(get("/students/appointments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].appointmentId").value(42))
                .andExpect(jsonPath("$[0].staffName").value("Dr. Ayşe Yılmaz"))
                .andExpect(jsonPath("$[0].appointmentStatus").value("PENDING"));

        verify(appointmentService).getStudentActiveAppointments();
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void getPastAppointments_asStudent_returnsOk() throws Exception {
        StudentAppointmentResponseDto item = StudentAppointmentResponseDto.builder()
                .appointmentId(55)
                .staffId(5)
                .staffName("Dr. Ayşe Yılmaz")
                .appointmentDate(LocalDate.of(2026, 6, 10))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 30))
                .categoryName("Danışmanlık")
                .meetingType(MeetingType.FACE_TO_FACE.name())
                .appointmentStatus(AppointmentStatus.COMPLETED.name())
                .build();
        when(appointmentService.getStudentPastAppointments()).thenReturn(List.of(item));

        mockMvc.perform(get("/students/appointments/past"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].appointmentId").value(55))
                .andExpect(jsonPath("$[0].appointmentStatus").value("COMPLETED"));

        verify(appointmentService).getStudentPastAppointments();
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void getPastAppointments_asAcademician_returnsForbidden() throws Exception {
        mockMvc.perform(get("/students/appointments/past"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void getAppointment_asStudent_returnsOk() throws Exception {
        StudentAppointmentResponseDto item = StudentAppointmentResponseDto.builder()
                .appointmentId(42)
                .staffId(5)
                .staffName("Dr. Ayşe Yılmaz")
                .academicTitle("Doç. Dr.")
                .departmentName("Bilgisayar Mühendisliği")
                .appointmentDate(LocalDate.of(2026, 7, 22))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .categoryName("Danışmanlık")
                .meetingType(MeetingType.ONLINE.name())
                .appointmentStatus(AppointmentStatus.APPROVED.name())
                .officeName(null)
                .officeLocation(null)
                .build();
        when(appointmentService.getStudentAppointment(42)).thenReturn(item);

        mockMvc.perform(get("/students/appointments/42"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appointmentId").value(42))
                .andExpect(jsonPath("$.meetingType").value("ONLINE"))
                .andExpect(jsonPath("$.appointmentStatus").value("APPROVED"));

        verify(appointmentService).getStudentAppointment(42);
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void cancelAppointment_asStudent_returnsOk() throws Exception {
        StudentAppointmentResponseDto item = StudentAppointmentResponseDto.builder()
                .appointmentId(42)
                .staffId(5)
                .staffName("Dr. Ayşe Yılmaz")
                .appointmentDate(LocalDate.of(2026, 7, 22))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .categoryName("Danışmanlık")
                .meetingType(MeetingType.FACE_TO_FACE.name())
                .appointmentStatus(AppointmentStatus.CANCELLED.name())
                .build();
        when(appointmentService.cancelStudentAppointment(42)).thenReturn(item);

        mockMvc.perform(patch("/students/appointments/42/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appointmentId").value(42))
                .andExpect(jsonPath("$.appointmentStatus").value("CANCELLED"));

        verify(appointmentService).cancelStudentAppointment(42);
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void cancelAppointment_asAcademician_returnsForbidden() throws Exception {
        mockMvc.perform(patch("/students/appointments/42/cancel"))
                .andExpect(status().isForbidden());
    }

    @Test
    void cancelAppointment_unauthenticated_returnsUnauthorized() throws Exception {
        mockMvc.perform(patch("/students/appointments/42/cancel"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void getAppointment_asAcademician_returnsForbidden() throws Exception {
        mockMvc.perform(get("/students/appointments/42"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAppointment_unauthenticated_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/students/appointments/42"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void getActiveAppointments_asAcademician_returnsForbidden() throws Exception {
        mockMvc.perform(get("/students/appointments"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getActiveAppointments_unauthenticated_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/students/appointments"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void createAppointment_asStudent_returnsCreated() throws Exception {
        AppointmentResponseDto response = AppointmentResponseDto.builder()
                .appointmentId(42)
                .studentId(3)
                .staffId(5)
                .categoryId(1)
                .courseId(null)
                .slotId(10)
                .appointmentStatus(AppointmentStatus.PENDING.name())
                .meetingType(MeetingType.FACE_TO_FACE.name())
                .isLimitedDuration(false)
                .build();
        when(appointmentService.createAppointment(any(AppointmentCreateRequest.class)))
                .thenReturn(response);

        AppointmentCreateRequest request = new AppointmentCreateRequest();
        request.setSlotId(10);
        request.setCategoryId(1);
        request.setMeetingType(MeetingType.FACE_TO_FACE.name());

        mockMvc.perform(post("/students/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.appointmentId").value(42))
                .andExpect(jsonPath("$.appointmentStatus").value("PENDING"));

        verify(appointmentService).createAppointment(any(AppointmentCreateRequest.class));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void createAppointment_asAcademician_returnsForbidden() throws Exception {
        AppointmentCreateRequest request = new AppointmentCreateRequest();
        request.setSlotId(10);
        request.setCategoryId(1);

        mockMvc.perform(post("/students/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void createAppointment_unauthenticated_returnsUnauthorized() throws Exception {
        AppointmentCreateRequest request = new AppointmentCreateRequest();
        request.setSlotId(10);
        request.setCategoryId(1);

        mockMvc.perform(post("/students/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}
