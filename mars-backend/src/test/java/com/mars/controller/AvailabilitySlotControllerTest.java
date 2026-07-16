package com.mars.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import com.mars.dto.AvailabilitySlotCreateRequest;
import com.mars.dto.AvailabilitySlotResponseDto;
import com.mars.exception.handler.GlobalExceptionHandler;
import com.mars.security.JwtAuthenticationFilter;
import com.mars.security.SecurityConfig;
import com.mars.security.SecurityErrorWriter;
import com.mars.service.AvailabilitySlotService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;

@WebMvcTest(controllers = AvailabilitySlotController.class)
@Import({
        SecurityConfig.class,
        SecurityErrorWriter.class,
        CorsConfig.class,
        GlobalExceptionHandler.class
})
class AvailabilitySlotControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AvailabilitySlotService availabilitySlotService;

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
    void getMySlots_asAcademician_returnsSlots() throws Exception {
        when(availabilitySlotService.getMySlots()).thenReturn(List.of(
                AvailabilitySlotResponseDto.builder()
                        .slotId(1)
                        .slotDate(LocalDate.of(2026, 7, 20))
                        .startTime(LocalTime.of(10, 0))
                        .endTime(LocalTime.of(12, 0))
                        .isBlocked(false)
                        .build()));

        mockMvc.perform(get("/availability-slots/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slotId").value(1))
                .andExpect(jsonPath("$[0].slotDate").value("2026-07-20"))
                .andExpect(jsonPath("$[0].startTime").value("10:00:00"))
                .andExpect(jsonPath("$[0].endTime").value("12:00:00"))
                .andExpect(jsonPath("$[0].isBlocked").value(false));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void createSlot_asAcademician_returnsCreated() throws Exception {
        AvailabilitySlotCreateRequest request = new AvailabilitySlotCreateRequest(
                LocalDate.of(2026, 7, 20),
                LocalTime.of(10, 0),
                LocalTime.of(12, 0));
        when(availabilitySlotService.createSlot(any(AvailabilitySlotCreateRequest.class))).thenReturn(
                AvailabilitySlotResponseDto.builder()
                        .slotId(1)
                        .slotDate(LocalDate.of(2026, 7, 20))
                        .startTime(LocalTime.of(10, 0))
                        .endTime(LocalTime.of(12, 0))
                        .isBlocked(false)
                        .build());

        mockMvc.perform(post("/availability-slots")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slotId").value(1))
                .andExpect(jsonPath("$.isBlocked").value(false));

        verify(availabilitySlotService).createSlot(any(AvailabilitySlotCreateRequest.class));
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void createSlot_invalidBody_returnsBadRequest() throws Exception {
        AvailabilitySlotCreateRequest request = new AvailabilitySlotCreateRequest(null, null, null);

        mockMvc.perform(post("/availability-slots")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void createSlot_asStudent_returnsForbidden() throws Exception {
        AvailabilitySlotCreateRequest request = new AvailabilitySlotCreateRequest(
                LocalDate.of(2026, 7, 20),
                LocalTime.of(10, 0),
                LocalTime.of(12, 0));

        mockMvc.perform(post("/availability-slots")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @WithMockUser(roles = "HOD")
    void getMySlots_asHod_returnsOk() throws Exception {
        when(availabilitySlotService.getMySlots()).thenReturn(List.of());

        mockMvc.perform(get("/availability-slots/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void getMySlots_asStudent_returnsForbidden() throws Exception {
        mockMvc.perform(get("/availability-slots/my"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void getMySlots_unauthenticated_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/availability-slots/my"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(401));
    }
}
