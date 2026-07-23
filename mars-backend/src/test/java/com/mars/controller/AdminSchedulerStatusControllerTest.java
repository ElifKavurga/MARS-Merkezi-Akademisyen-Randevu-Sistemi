package com.mars.controller;

import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
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
import com.mars.exception.handler.GlobalExceptionHandler;
import com.mars.security.JwtAuthenticationFilter;
import com.mars.security.SecurityConfig;
import com.mars.security.SecurityErrorWriter;
import com.mars.service.SchedulerRegistry;
import com.mars.service.SchedulerRunResult;
import com.mars.service.SchedulerRunResult.SchedulerStatus;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;

@WebMvcTest(controllers = AdminSchedulerStatusController.class)
@Import({
        SecurityConfig.class,
        SecurityErrorWriter.class,
        CorsConfig.class,
        GlobalExceptionHandler.class
})
class AdminSchedulerStatusControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SchedulerRegistry schedulerRegistry;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @BeforeEach
    void passThroughJwtFilter() throws Exception {
        doAnswer(invocation -> {
            FilterChain chain = invocation.getArgument(2);
            ServletRequest req = invocation.getArgument(0);
            ServletResponse res = invocation.getArgument(1);
            chain.doFilter(req, res);
            return null;
        }).when(jwtAuthenticationFilter).doFilter(
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void admin_canAccessSchedulerStatus() throws Exception {
        LocalDateTime now = LocalDateTime.of(2026, 7, 23, 14, 0);
        SchedulerRunResult result = new SchedulerRunResult(
                "AppointmentStatusUpdate", now, now, 42L, 5, 4, 1, 0, SchedulerStatus.SUCCESS);
        when(schedulerRegistry.getAll()).thenReturn(List.of(result));

        mockMvc.perform(get("/admin/scheduler-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].schedulerName").value("AppointmentStatusUpdate"))
                .andExpect(jsonPath("$[0].status").value("SUCCESS"))
                .andExpect(jsonPath("$[0].processed").value(5))
                .andExpect(jsonPath("$[0].errors").value(0));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void student_cannotAccessSchedulerStatus() throws Exception {
        mockMvc.perform(get("/admin/scheduler-status"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void academician_cannotAccessSchedulerStatus() throws Exception {
        mockMvc.perform(get("/admin/scheduler-status"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void emptyRegistry_returnsEmptyList() throws Exception {
        when(schedulerRegistry.getAll()).thenReturn(List.of());

        mockMvc.perform(get("/admin/scheduler-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void multipleSchedulers_returnedSortedByName() throws Exception {
        LocalDateTime now = LocalDateTime.of(2026, 7, 23, 14, 0);
        List<SchedulerRunResult> results = List.of(
                new SchedulerRunResult("WaitlistOfferExpiry", now, now, 10L, 0, 0, 0, 0, SchedulerStatus.SUCCESS),
                new SchedulerRunResult("AppointmentStatusUpdate", now, now, 20L, 0, 0, 0, 0, SchedulerStatus.SUCCESS)
        );
        when(schedulerRegistry.getAll()).thenReturn(results);

        mockMvc.perform(get("/admin/scheduler-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].schedulerName").value("AppointmentStatusUpdate"))
                .andExpect(jsonPath("$[1].schedulerName").value("WaitlistOfferExpiry"));
    }
}
