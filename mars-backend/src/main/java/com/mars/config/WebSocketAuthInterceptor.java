package com.mars.config;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import com.mars.security.CustomUserDetailsService;
import com.mars.security.JwtService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String USER_NOTIFICATION_DESTINATION = "/user/queue/notifications";

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(
                message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }
        StompCommand command = accessor.getCommand();
        if (command == StompCommand.MESSAGE && !hasValidSessionToken(accessor)) {
            return null;
        }
        if (command == StompCommand.CONNECT) {
            authenticate(accessor);
        } else if (command == StompCommand.SUBSCRIBE
                && !USER_NOTIFICATION_DESTINATION.equals(accessor.getDestination())) {
            throw new IllegalArgumentException("Bu WebSocket kanalına erişim yetkiniz yok.");
        } else if (command == StompCommand.SEND) {
            throw new IllegalArgumentException("WebSocket üzerinden mesaj gönderilemez.");
        }
        return message;
    }

    private void authenticate(StompHeaderAccessor accessor) {
        List<String> values = accessor.getNativeHeader(HttpHeaders.AUTHORIZATION);
        String authorization = values == null || values.isEmpty() ? null : values.getFirst();
        if (authorization == null || !authorization.startsWith(BEARER_PREFIX)) {
            throw new IllegalArgumentException("WebSocket kimlik doğrulaması gerekli.");
        }

        String token = authorization.substring(BEARER_PREFIX.length());
        if (!jwtService.isTokenValid(token)) {
            throw new IllegalArgumentException("Geçersiz WebSocket kimlik bilgisi.");
        }
        String username = jwtService.extractUsername(token);
        UserDetails details = userDetailsService.loadUserByUsername(username);
        if (!details.isEnabled() || !jwtService.isTokenValid(token, details.getUsername())) {
            throw new IllegalArgumentException("Geçersiz WebSocket kimlik bilgisi.");
        }
        accessor.setUser(new UsernamePasswordAuthenticationToken(
                details, token, details.getAuthorities()));
    }

    private boolean hasValidSessionToken(StompHeaderAccessor accessor) {
        if (!(accessor.getUser() instanceof Authentication authentication)
                || !(authentication.getCredentials() instanceof String token)) {
            return false;
        }
        return jwtService.isTokenValid(token, authentication.getName());
    }
}
