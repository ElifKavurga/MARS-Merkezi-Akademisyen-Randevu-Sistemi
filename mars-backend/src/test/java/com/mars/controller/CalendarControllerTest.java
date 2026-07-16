package com.mars.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import com.mars.dto.CalendarEventResponseDto;
import com.mars.exception.handler.GlobalExceptionHandler;
import com.mars.security.JwtAuthenticationFilter;
import com.mars.security.SecurityConfig;
import com.mars.security.SecurityErrorWriter;
import com.mars.service.CalendarService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;

@WebMvcTest(controllers = CalendarController.class)
@Import({
        SecurityConfig.class,
        SecurityErrorWriter.class,
        CorsConfig.class,
        GlobalExceptionHandler.class
})
class CalendarControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CalendarService calendarService;

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
    void getEvents_asAcademician_returnsEvents() throws Exception {
        when(calendarService.getEvents(eq(LocalDate.of(2026, 7, 13)), eq(LocalDate.of(2026, 7, 19))))
                .thenReturn(List.of(
                        CalendarEventResponseDto.builder()
                                .slotId(1)
                                .slotDate(LocalDate.of(2026, 7, 14))
                                .startTime(LocalTime.of(10, 0))
                                .endTime(LocalTime.of(12, 0))
                                .recurrenceRuleId(null)
                                .isBlocked(false)
                                .build(),
                        CalendarEventResponseDto.builder()
                                .slotId(2)
                                .slotDate(LocalDate.of(2026, 7, 15))
                                .startTime(LocalTime.of(14, 0))
                                .endTime(LocalTime.of(15, 0))
                                .recurrenceRuleId(5)
                                .isBlocked(true)
                                .build()));

        mockMvc.perform(get("/calendar/events")
                        .param("from", "2026-07-13")
                        .param("to", "2026-07-19"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slotId").value(1))
                .andExpect(jsonPath("$[0].slotDate").value("2026-07-14"))
                .andExpect(jsonPath("$[0].startTime").value("10:00:00"))
                .andExpect(jsonPath("$[0].endTime").value("12:00:00"))
                .andExpect(jsonPath("$[0].isBlocked").value(false))
                .andExpect(jsonPath("$[1].recurrenceRuleId").value(5))
                .andExpect(jsonPath("$[1].isBlocked").value(true));

        verify(calendarService).getEvents(LocalDate.of(2026, 7, 13), LocalDate.of(2026, 7, 19));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void getEvents_asStudent_returnsForbidden() throws Exception {
        mockMvc.perform(get("/calendar/events")
                        .param("from", "2026-07-13")
                        .param("to", "2026-07-19"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getEvents_unauthenticated_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/calendar/events")
                        .param("from", "2026-07-13")
                        .param("to", "2026-07-19"))
                .andExpect(status().isUnauthorized());
    }
}
