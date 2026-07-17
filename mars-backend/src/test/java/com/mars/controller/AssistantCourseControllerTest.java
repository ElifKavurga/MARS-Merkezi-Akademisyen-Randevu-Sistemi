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
import com.mars.exception.handler.GlobalExceptionHandler;
import com.mars.security.JwtAuthenticationFilter;
import com.mars.security.SecurityConfig;
import com.mars.security.SecurityErrorWriter;
import com.mars.service.AssistantCourseService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;

@WebMvcTest(controllers = AssistantCourseController.class)
@Import({
        SecurityConfig.class,
        SecurityErrorWriter.class,
        CorsConfig.class,
        GlobalExceptionHandler.class
})
class AssistantCourseControllerTest {

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
    void getAssignedCourses_asAssistant_returnsOwnCourses() throws Exception {
        when(assistantCourseService.getAssignedCourses()).thenReturn(List.of(
                AssistantCourseResponseDto.builder()
                        .courseId(1)
                        .courseCode("BLM101")
                        .courseName("Programlamaya Giriş")
                        .academicTerm("2026-2027 Güz")
                        .ownerAcademicianName("Dr. Akademisyen")
                        .build()));

        mockMvc.perform(get("/assistant/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].courseId").value(1))
                .andExpect(jsonPath("$[0].courseCode").value("BLM101"))
                .andExpect(jsonPath("$[0].ownerAcademicianName").value("Dr. Akademisyen"));

        verify(assistantCourseService).getAssignedCourses();
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void getAssignedCourses_asStudent_returnsForbidden() throws Exception {
        assertForbidden();
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void getAssignedCourses_asAcademician_returnsForbidden() throws Exception {
        assertForbidden();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAssignedCourses_asAdmin_returnsForbidden() throws Exception {
        assertForbidden();
    }

    @Test
    @WithMockUser(roles = "HOD")
    void getAssignedCourses_asHod_returnsForbidden() throws Exception {
        assertForbidden();
    }

    private void assertForbidden() throws Exception {
        mockMvc.perform(get("/assistant/courses"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }
}
