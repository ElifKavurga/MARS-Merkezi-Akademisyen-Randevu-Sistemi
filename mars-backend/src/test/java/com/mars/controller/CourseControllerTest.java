package com.mars.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import com.mars.dto.CourseCreateRequest;
import com.mars.dto.CourseResponseDto;
import com.mars.dto.CourseUpdateRequest;
import com.mars.exception.handler.GlobalExceptionHandler;
import com.mars.security.JwtAuthenticationFilter;
import com.mars.security.SecurityConfig;
import com.mars.security.SecurityErrorWriter;
import com.mars.service.CourseService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;

@WebMvcTest(controllers = CourseController.class)
@Import({
        SecurityConfig.class,
        SecurityErrorWriter.class,
        CorsConfig.class,
        GlobalExceptionHandler.class
})
class CourseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CourseService courseService;

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
    void getMyCourses_asAcademician_returnsCourses() throws Exception {
        when(courseService.getMyCourses()).thenReturn(List.of(
                CourseResponseDto.builder()
                        .courseId(1)
                        .courseCode("CENG 301")
                        .courseName("Algoritma Analizi")
                        .academicTerm("2024-2025 Güz")
                        .departmentId(1)
                        .departmentName("Bilgisayar Mühendisliği")
                        .build()));

        mockMvc.perform(get("/courses/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].courseId").value(1))
                .andExpect(jsonPath("$[0].courseCode").value("CENG 301"))
                .andExpect(jsonPath("$[0].courseName").value("Algoritma Analizi"))
                .andExpect(jsonPath("$[0].academicTerm").value("2024-2025 Güz"))
                .andExpect(jsonPath("$[0].departmentId").value(1))
                .andExpect(jsonPath("$[0].departmentName").value("Bilgisayar Mühendisliği"));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void getMyCourse_asAcademician_returnsCourse() throws Exception {
        when(courseService.getMyCourse(1)).thenReturn(
                CourseResponseDto.builder()
                        .courseId(1)
                        .courseCode("CENG 301")
                        .courseName("Algoritma Analizi")
                        .academicTerm("2024-2025 Güz")
                        .departmentId(1)
                        .departmentName("Bilgisayar Mühendisliği")
                        .isActive(true)
                        .build());

        mockMvc.perform(get("/courses/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courseId").value(1))
                .andExpect(jsonPath("$.courseCode").value("CENG 301"))
                .andExpect(jsonPath("$.isActive").value(true));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void getMyCourse_asStudent_returnsForbidden() throws Exception {
        mockMvc.perform(get("/courses/1"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @WithMockUser(roles = "HOD")
    void getMyCourses_asHod_returnsOk() throws Exception {
        when(courseService.getMyCourses()).thenReturn(List.of());

        mockMvc.perform(get("/courses/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void getMyCourses_asStudent_returnsForbidden() throws Exception {
        mockMvc.perform(get("/courses/my"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getMyCourses_asAdmin_returnsForbidden() throws Exception {
        mockMvc.perform(get("/courses/my"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void getMyCourses_unauthenticated_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/courses/my"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void createCourse_asAcademician_returnsCreated() throws Exception {
        CourseCreateRequest request = new CourseCreateRequest("CENG 301", "Algoritma Analizi", "2024-2025 Güz", 1);
        when(courseService.createCourse(any(CourseCreateRequest.class))).thenReturn(
                CourseResponseDto.builder()
                        .courseId(1)
                        .courseCode("CENG 301")
                        .courseName("Algoritma Analizi")
                        .academicTerm("2024-2025 Güz")
                        .departmentId(1)
                        .departmentName("Bilgisayar Mühendisliği")
                        .build());

        mockMvc.perform(post("/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.courseId").value(1))
                .andExpect(jsonPath("$.courseCode").value("CENG 301"))
                .andExpect(jsonPath("$.courseName").value("Algoritma Analizi"));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void createCourse_invalidBody_returnsBadRequest() throws Exception {
        CourseCreateRequest request = new CourseCreateRequest("", "", "", null);

        mockMvc.perform(post("/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void createCourse_asStudent_returnsForbidden() throws Exception {
        CourseCreateRequest request = new CourseCreateRequest("CENG 301", "Algoritma Analizi", "2024-2025 Güz", 1);

        mockMvc.perform(post("/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void updateCourse_asAcademician_returnsOk() throws Exception {
        CourseUpdateRequest request = new CourseUpdateRequest("CENG 302", "Veri Yapıları", "2024-2025 Bahar", 1);
        when(courseService.updateCourse(eq(1), any(CourseUpdateRequest.class))).thenReturn(
                CourseResponseDto.builder()
                        .courseId(1)
                        .courseCode("CENG 302")
                        .courseName("Veri Yapıları")
                        .academicTerm("2024-2025 Bahar")
                        .departmentId(1)
                        .departmentName("Bilgisayar Mühendisliği")
                        .build());

        mockMvc.perform(put("/courses/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courseId").value(1))
                .andExpect(jsonPath("$.courseCode").value("CENG 302"))
                .andExpect(jsonPath("$.courseName").value("Veri Yapıları"));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void updateCourse_invalidBody_returnsBadRequest() throws Exception {
        CourseUpdateRequest request = new CourseUpdateRequest("", "", "", null);

        mockMvc.perform(put("/courses/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void updateCourse_asStudent_returnsForbidden() throws Exception {
        CourseUpdateRequest request = new CourseUpdateRequest("CENG 302", "Veri Yapıları", "2024-2025 Bahar", 1);

        mockMvc.perform(put("/courses/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void changeCourseStatus_asAcademician_returnsOk() throws Exception {
        when(courseService.changeCourseStatus(1)).thenReturn(
                CourseResponseDto.builder()
                        .courseId(1)
                        .courseCode("CENG 301")
                        .courseName("Algoritma Analizi")
                        .academicTerm("2024-2025 Güz")
                        .departmentId(1)
                        .departmentName("Bilgisayar Mühendisliği")
                        .isActive(false)
                        .build());

        mockMvc.perform(patch("/courses/1/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courseId").value(1))
                .andExpect(jsonPath("$.courseCode").value("CENG 301"))
                .andExpect(jsonPath("$.isActive").value(false));

        verify(courseService).changeCourseStatus(1);
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void changeCourseStatus_asStudent_returnsForbidden() throws Exception {
        mockMvc.perform(patch("/courses/1/status"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(403));
    }
}
