package com.mars.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import com.mars.dto.admin.PenaltyRuleResponse;
import com.mars.dto.admin.UpdatePenaltyRuleRequest;
import com.mars.exception.handler.GlobalExceptionHandler;
import com.mars.security.JwtAuthenticationFilter;
import com.mars.security.SecurityConfig;
import com.mars.security.SecurityErrorWriter;
import com.mars.service.AdminPenaltyRuleService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;

@WebMvcTest(controllers = AdminPenaltyRuleController.class)
@Import({
        SecurityConfig.class,
        SecurityErrorWriter.class,
        CorsConfig.class,
        GlobalExceptionHandler.class
})
class AdminPenaltyRuleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminPenaltyRuleService adminPenaltyRuleService;

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
    @WithMockUser(roles = "ADMIN")
    void getPenaltyRule_asAdmin_returnsRule() throws Exception {
        when(adminPenaltyRuleService.getPenaltyRule()).thenReturn(
                PenaltyRuleResponse.builder()
                        .penaltyRuleId(1)
                        .maxNoShowCount(3)
                        .banDurationDays(7)
                        .isActive(true)
                        .build());

        mockMvc.perform(get("/admin/penalty-rule"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.penaltyRuleId").value(1))
                .andExpect(jsonPath("$.maxNoShowCount").value(3))
                .andExpect(jsonPath("$.banDurationDays").value(7))
                .andExpect(jsonPath("$.isActive").value(true));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void getPenaltyRule_asStudent_returnsForbidden() throws Exception {
        mockMvc.perform(get("/admin/penalty-rule"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void getPenaltyRule_unauthenticated_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/admin/penalty-rule"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updatePenaltyRule_asAdmin_returnsUpdatedRule() throws Exception {
        UpdatePenaltyRuleRequest request = new UpdatePenaltyRuleRequest(5, 14, true);
        when(adminPenaltyRuleService.updatePenaltyRule(any(UpdatePenaltyRuleRequest.class))).thenReturn(
                PenaltyRuleResponse.builder()
                        .penaltyRuleId(1)
                        .maxNoShowCount(5)
                        .banDurationDays(14)
                        .isActive(true)
                        .build());

        mockMvc.perform(put("/admin/penalty-rule")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.maxNoShowCount").value(5))
                .andExpect(jsonPath("$.banDurationDays").value(14));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updatePenaltyRule_invalidBody_returnsBadRequest() throws Exception {
        UpdatePenaltyRuleRequest request = new UpdatePenaltyRuleRequest(0, 14, true);

        mockMvc.perform(put("/admin/penalty-rule")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400));
    }
}
