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
import com.mars.dto.OutOfOfficePeriodCreateRequest;
import com.mars.dto.OutOfOfficePeriodResponseDto;
import com.mars.dto.OutOfOfficePeriodUpdateRequest;
import com.mars.enums.ReasonCode;
import com.mars.exception.handler.GlobalExceptionHandler;
import com.mars.security.JwtAuthenticationFilter;
import com.mars.security.SecurityConfig;
import com.mars.security.SecurityErrorWriter;
import com.mars.service.OutOfOfficePeriodService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;

@WebMvcTest(controllers = OutOfOfficePeriodController.class)
@Import({
        SecurityConfig.class,
        SecurityErrorWriter.class,
        CorsConfig.class,
        GlobalExceptionHandler.class
})
class OutOfOfficePeriodControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OutOfOfficePeriodService outOfOfficePeriodService;

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
    void getMyPeriods_asAcademician_returnsPeriods() throws Exception {
        when(outOfOfficePeriodService.getMyPeriods()).thenReturn(List.of(
                OutOfOfficePeriodResponseDto.builder()
                        .outOfOfficeId(1)
                        .startDate(LocalDate.of(2026, 8, 1))
                        .endDate(LocalDate.of(2026, 8, 5))
                        .reasonCode(ReasonCode.CONFERENCE.name())
                        .build()));

        mockMvc.perform(get("/out-of-office/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].outOfOfficeId").value(1))
                .andExpect(jsonPath("$[0].reasonCode").value("CONFERENCE"));

        verify(outOfOfficePeriodService).getMyPeriods();
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void createPeriod_asAcademician_returnsCreated() throws Exception {
        OutOfOfficePeriodCreateRequest request = new OutOfOfficePeriodCreateRequest(
                LocalDate.of(2026, 8, 10),
                LocalDate.of(2026, 8, 12),
                ReasonCode.LEAVE.name());
        when(outOfOfficePeriodService.createPeriod(any(OutOfOfficePeriodCreateRequest.class)))
                .thenReturn(OutOfOfficePeriodResponseDto.builder()
                        .outOfOfficeId(5)
                        .startDate(LocalDate.of(2026, 8, 10))
                        .endDate(LocalDate.of(2026, 8, 12))
                        .reasonCode(ReasonCode.LEAVE.name())
                        .build());

        mockMvc.perform(post("/out-of-office")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.outOfOfficeId").value(5))
                .andExpect(jsonPath("$.reasonCode").value("LEAVE"));

        verify(outOfOfficePeriodService).createPeriod(any(OutOfOfficePeriodCreateRequest.class));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void createPeriod_asStudent_returnsForbidden() throws Exception {
        OutOfOfficePeriodCreateRequest request = new OutOfOfficePeriodCreateRequest(
                LocalDate.of(2026, 8, 10),
                LocalDate.of(2026, 8, 12),
                ReasonCode.LEAVE.name());

        mockMvc.perform(post("/out-of-office")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void createPeriod_unauthenticated_returnsUnauthorized() throws Exception {
        OutOfOfficePeriodCreateRequest request = new OutOfOfficePeriodCreateRequest(
                LocalDate.of(2026, 8, 10),
                LocalDate.of(2026, 8, 12),
                ReasonCode.LEAVE.name());

        mockMvc.perform(post("/out-of-office")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void getMyPeriods_asStudent_returnsForbidden() throws Exception {
        mockMvc.perform(get("/out-of-office/my"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getMyPeriods_unauthenticated_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/out-of-office/my"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void updatePeriod_asAcademician_returnsOk() throws Exception {
        OutOfOfficePeriodUpdateRequest request = new OutOfOfficePeriodUpdateRequest(
                LocalDate.of(2026, 8, 11),
                LocalDate.of(2026, 8, 13),
                ReasonCode.CONFERENCE.name());
        when(outOfOfficePeriodService.updatePeriod(eq(5), any(OutOfOfficePeriodUpdateRequest.class)))
                .thenReturn(OutOfOfficePeriodResponseDto.builder()
                        .outOfOfficeId(5)
                        .startDate(LocalDate.of(2026, 8, 11))
                        .endDate(LocalDate.of(2026, 8, 13))
                        .reasonCode(ReasonCode.CONFERENCE.name())
                        .build());

        mockMvc.perform(put("/out-of-office/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.outOfOfficeId").value(5))
                .andExpect(jsonPath("$.reasonCode").value("CONFERENCE"));

        verify(outOfOfficePeriodService).updatePeriod(eq(5), any(OutOfOfficePeriodUpdateRequest.class));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void updatePeriod_asStudent_returnsForbidden() throws Exception {
        OutOfOfficePeriodUpdateRequest request = new OutOfOfficePeriodUpdateRequest(
                LocalDate.of(2026, 8, 11),
                LocalDate.of(2026, 8, 13),
                ReasonCode.CONFERENCE.name());

        mockMvc.perform(put("/out-of-office/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void endPeriod_asAcademician_returnsOk() throws Exception {
        when(outOfOfficePeriodService.endPeriod(5))
                .thenReturn(OutOfOfficePeriodResponseDto.builder()
                        .outOfOfficeId(5)
                        .startDate(LocalDate.of(2026, 8, 1))
                        .endDate(LocalDate.now())
                        .reasonCode(ReasonCode.LEAVE.name())
                        .build());

        mockMvc.perform(patch("/out-of-office/5/end"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.outOfOfficeId").value(5));

        verify(outOfOfficePeriodService).endPeriod(5);
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void endPeriod_asStudent_returnsForbidden() throws Exception {
        mockMvc.perform(patch("/out-of-office/5/end"))
                .andExpect(status().isForbidden());
    }
}
