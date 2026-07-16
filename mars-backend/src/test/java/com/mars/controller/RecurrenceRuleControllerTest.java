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

import java.time.LocalDate;

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
import com.mars.dto.RecurrenceRuleCreateRequest;
import com.mars.dto.RecurrenceRuleResponseDto;
import com.mars.dto.RecurrenceRuleUpdateRequest;
import com.mars.enums.RepeatType;
import com.mars.exception.BadRequestException;
import com.mars.exception.ConflictException;
import com.mars.exception.ResourceNotFoundException;
import com.mars.exception.handler.GlobalExceptionHandler;
import com.mars.security.JwtAuthenticationFilter;
import com.mars.security.SecurityConfig;
import com.mars.security.SecurityErrorWriter;
import com.mars.service.RecurrenceRuleService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;

@WebMvcTest(controllers = RecurrenceRuleController.class)
@Import({
        SecurityConfig.class,
        SecurityErrorWriter.class,
        CorsConfig.class,
        GlobalExceptionHandler.class
})
class RecurrenceRuleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RecurrenceRuleService recurrenceRuleService;

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
    void updateRule_successfulUpdate_returnsOk() throws Exception {
        RecurrenceRuleUpdateRequest request = new RecurrenceRuleUpdateRequest(
                RepeatType.WEEKLY.name(),
                10,
                LocalDate.of(2026, 7, 21),
                LocalDate.of(2026, 9, 21));
        when(recurrenceRuleService.updateRule(eq(5), any(RecurrenceRuleUpdateRequest.class)))
                .thenReturn(RecurrenceRuleResponseDto.builder()
                        .recurrenceRuleId(5)
                        .repeatType(RepeatType.WEEKLY.name())
                        .repeatCount(10)
                        .startDate(LocalDate.of(2026, 7, 21))
                        .endDate(LocalDate.of(2026, 9, 21))
                        .build());

        mockMvc.perform(put("/recurrence-rules/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recurrenceRuleId").value(5))
                .andExpect(jsonPath("$.repeatCount").value(10));

        verify(recurrenceRuleService).updateRule(eq(5), any(RecurrenceRuleUpdateRequest.class));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void updateRule_invalidDateRange_returnsBadRequest() throws Exception {
        RecurrenceRuleUpdateRequest request = new RecurrenceRuleUpdateRequest(
                RepeatType.WEEKLY.name(),
                10,
                LocalDate.of(2026, 9, 21),
                LocalDate.of(2026, 7, 21));
        when(recurrenceRuleService.updateRule(eq(5), any(RecurrenceRuleUpdateRequest.class)))
                .thenThrow(new BadRequestException("Bitiş tarihi başlangıç tarihinden önce olamaz."));

        mockMvc.perform(put("/recurrence-rules/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void updateRule_unauthorizedUser_returnsForbidden() throws Exception {
        RecurrenceRuleUpdateRequest request = new RecurrenceRuleUpdateRequest(
                RepeatType.WEEKLY.name(),
                10,
                LocalDate.of(2026, 7, 21),
                LocalDate.of(2026, 9, 21));

        mockMvc.perform(put("/recurrence-rules/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void updateRule_ruleNotFound_returnsNotFound() throws Exception {
        RecurrenceRuleUpdateRequest request = new RecurrenceRuleUpdateRequest(
                RepeatType.WEEKLY.name(),
                10,
                LocalDate.of(2026, 7, 21),
                LocalDate.of(2026, 9, 21));
        when(recurrenceRuleService.updateRule(eq(99), any(RecurrenceRuleUpdateRequest.class)))
                .thenThrow(new ResourceNotFoundException("Tekrar kuralı bulunamadı."));

        mockMvc.perform(put("/recurrence-rules/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void updateRule_pastRule_returnsBadRequest() throws Exception {
        RecurrenceRuleUpdateRequest request = new RecurrenceRuleUpdateRequest(
                RepeatType.WEEKLY.name(),
                10,
                LocalDate.of(2026, 7, 21),
                LocalDate.of(2026, 9, 21));
        when(recurrenceRuleService.updateRule(eq(5), any(RecurrenceRuleUpdateRequest.class)))
                .thenThrow(new BadRequestException("Geçmişte tamamlanmış tekrarlar güncellenemez."));

        mockMvc.perform(put("/recurrence-rules/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Geçmişte tamamlanmış tekrarlar güncellenemez."));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void getRule_asAcademician_returnsOk() throws Exception {
        when(recurrenceRuleService.getRule(5)).thenReturn(RecurrenceRuleResponseDto.builder()
                .recurrenceRuleId(5)
                .repeatType(RepeatType.WEEKLY.name())
                .repeatCount(8)
                .startDate(LocalDate.of(2026, 7, 20))
                .endDate(LocalDate.of(2026, 9, 14))
                .build());

        mockMvc.perform(get("/recurrence-rules/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recurrenceRuleId").value(5))
                .andExpect(jsonPath("$.repeatType").value("WEEKLY"));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void createRule_asAcademician_returnsCreated() throws Exception {
        RecurrenceRuleCreateRequest request = new RecurrenceRuleCreateRequest(
                RepeatType.WEEKLY.name(),
                8,
                LocalDate.of(2026, 7, 20),
                LocalDate.of(2026, 9, 14));
        when(recurrenceRuleService.createRule(eq(1), any(RecurrenceRuleCreateRequest.class)))
                .thenReturn(RecurrenceRuleResponseDto.builder()
                        .recurrenceRuleId(5)
                        .repeatType(RepeatType.WEEKLY.name())
                        .repeatCount(8)
                        .startDate(LocalDate.of(2026, 7, 20))
                        .endDate(LocalDate.of(2026, 9, 14))
                        .build());

        mockMvc.perform(post("/recurrence-rules")
                        .param("slotId", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.recurrenceRuleId").value(5));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void endRule_successfulEnd_returnsOk() throws Exception {
        when(recurrenceRuleService.endRule(5)).thenReturn(RecurrenceRuleResponseDto.builder()
                .recurrenceRuleId(5)
                .repeatType(RepeatType.WEEKLY.name())
                .repeatCount(8)
                .startDate(LocalDate.of(2026, 7, 20))
                .endDate(LocalDate.now())
                .build());

        mockMvc.perform(patch("/recurrence-rules/5/end"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recurrenceRuleId").value(5));

        verify(recurrenceRuleService).endRule(5);
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void endRule_unauthorizedUser_returnsForbidden() throws Exception {
        mockMvc.perform(patch("/recurrence-rules/5/end"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void endRule_ruleNotFound_returnsNotFound() throws Exception {
        when(recurrenceRuleService.endRule(99))
                .thenThrow(new ResourceNotFoundException("Tekrar kuralı bulunamadı."));

        mockMvc.perform(patch("/recurrence-rules/99/end"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void endRule_alreadyEnded_returnsConflict() throws Exception {
        when(recurrenceRuleService.endRule(5))
                .thenThrow(new ConflictException("Bu tekrar kuralı daha önce sonlandırılmıştır."));

        mockMvc.perform(patch("/recurrence-rules/5/end"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(409));
    }
}
