package com.mars.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import com.mars.dto.CourseAssignmentUpdateRequest;
import com.mars.dto.CourseAssistantResponseDto;
import com.mars.exception.handler.GlobalExceptionHandler;
import com.mars.security.JwtAuthenticationFilter;
import com.mars.security.SecurityConfig;
import com.mars.security.SecurityErrorWriter;
import com.mars.service.CourseAssignmentService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;

@WebMvcTest(controllers = CourseAssignmentController.class)
@Import({
        SecurityConfig.class,
        SecurityErrorWriter.class,
        CorsConfig.class,
        GlobalExceptionHandler.class
})
class CourseAssignmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CourseAssignmentService courseAssignmentService;

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
    void updateAssignment_asAcademician_returnsOk() throws Exception {
        CourseAssignmentUpdateRequest request = new CourseAssignmentUpdateRequest(21);
        when(courseAssignmentService.updateAssignment(eq(5), any(CourseAssignmentUpdateRequest.class)))
                .thenReturn(CourseAssistantResponseDto.builder()
                        .assignmentId(5)
                        .assistantId(21)
                        .assistantName("Ali Asistan")
                        .institutionalEmail("ali.asistan@mars.edu.tr")
                        .departmentName("Bilgisayar Mühendisliği")
                        .build());

        mockMvc.perform(put("/course-assignments/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignmentId").value(5))
                .andExpect(jsonPath("$.assistantId").value(21))
                .andExpect(jsonPath("$.assistantName").value("Ali Asistan"));

        verify(courseAssignmentService).updateAssignment(eq(5), any(CourseAssignmentUpdateRequest.class));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void removeAssignment_asAcademician_returnsNoContent() throws Exception {
        doNothing().when(courseAssignmentService).removeAssignment(5);

        mockMvc.perform(patch("/course-assignments/5/remove"))
                .andExpect(status().isNoContent());

        verify(courseAssignmentService).removeAssignment(5);
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void updateAssignment_asStudent_returnsForbidden() throws Exception {
        CourseAssignmentUpdateRequest request = new CourseAssignmentUpdateRequest(21);

        mockMvc.perform(put("/course-assignments/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void removeAssignment_asStudent_returnsForbidden() throws Exception {
        mockMvc.perform(patch("/course-assignments/5/remove"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void updateAssignment_invalidBody_returnsBadRequest() throws Exception {
        CourseAssignmentUpdateRequest request = new CourseAssignmentUpdateRequest(null);

        mockMvc.perform(put("/course-assignments/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400));
    }
}
