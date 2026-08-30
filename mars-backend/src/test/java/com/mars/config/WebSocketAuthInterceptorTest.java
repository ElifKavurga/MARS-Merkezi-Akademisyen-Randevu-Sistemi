package com.mars.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import com.mars.security.CustomUserDetailsService;
import com.mars.security.JwtService;

@ExtendWith(MockitoExtension.class)
class WebSocketAuthInterceptorTest {

    @Mock private JwtService jwtService;
    @Mock private CustomUserDetailsService userDetailsService;
    @InjectMocks private WebSocketAuthInterceptor interceptor;

    @Test
    void connect_withValidJwt_attachesAuthenticatedPrincipalToOriginalMessage() {
        String token = "valid-token";
        String username = "user@mars.edu.tr";
        UserDetails details = User.withUsername(username)
                .password("password")
                .roles("STUDENT")
                .build();
        when(jwtService.isTokenValid(token)).thenReturn(true);
        when(jwtService.extractUsername(token)).thenReturn(username);
        when(userDetailsService.loadUserByUsername(username)).thenReturn(details);
        when(jwtService.isTokenValid(token, username, details.getPassword())).thenReturn(true);

        Message<byte[]> message = stompMessage(
                StompCommand.CONNECT, null, "Bearer " + token);
        Message<?> result = interceptor.preSend(message, mock(MessageChannel.class));
        StompHeaderAccessor resultAccessor = MessageHeaderAccessor.getAccessor(
                result, StompHeaderAccessor.class);

        assertThat(resultAccessor).isNotNull();
        assertThat(resultAccessor.getUser()).isNotNull();
        assertThat(resultAccessor.getUser().getName()).isEqualTo(username);
    }

    @Test
    void subscribe_toNonUserDestination_isRejected() {
        Message<byte[]> message = stompMessage(
                StompCommand.SUBSCRIBE, "/queue/notifications", null);

        assertThatThrownBy(() -> interceptor.preSend(message, mock(MessageChannel.class)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void outboundNotification_withExpiredSessionToken_isNotDelivered() {
        String token = "expired-token";
        UserDetails details = User.withUsername("user@mars.edu.tr")
                .password("password")
                .roles("STUDENT")
                .build();
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.MESSAGE);
        accessor.setUser(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                details, token, details.getAuthorities()));
        accessor.setLeaveMutable(true);
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
        when(jwtService.isTokenValid(token, details.getUsername(), details.getPassword())).thenReturn(false);

        assertThat(interceptor.preSend(message, mock(MessageChannel.class))).isNull();
    }

    private Message<byte[]> stompMessage(
            StompCommand command,
            String destination,
            String authorization) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        accessor.setLeaveMutable(true);
        if (destination != null) {
            accessor.setDestination(destination);
        }
        if (authorization != null) {
            accessor.setNativeHeader(HttpHeaders.AUTHORIZATION, authorization);
        }
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }
}
