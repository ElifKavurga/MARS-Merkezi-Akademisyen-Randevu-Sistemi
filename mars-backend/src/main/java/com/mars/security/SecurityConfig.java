package com.mars.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CorsConfigurationSource corsConfigurationSource;
    private final SecurityErrorWriter securityErrorWriter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .httpBasic(httpBasic -> httpBasic.disable())
                .formLogin(formLogin -> formLogin.disable())
                .logout(logout -> logout.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/reset-password").permitAll()
                        .requestMatchers(HttpMethod.GET, "/roles", "/departments").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers("/admin/users", "/admin/users/**").hasRole("ADMIN")
                        .requestMatchers("/admin/categories", "/admin/categories/**").hasRole("ADMIN")
                        .requestMatchers("/admin/penalty-rule", "/admin/penalty-rule/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/assistant/courses").hasRole("ASSISTANT")
                        .requestMatchers(HttpMethod.POST, "/appointments").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.GET, "/categories").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.GET, "/availability-slots/available").hasRole("STUDENT")
                        .requestMatchers("/courses", "/courses/**").hasAnyRole("ACADEMICIAN", "HOD")
                        .requestMatchers("/course-assignments", "/course-assignments/**")
                                .hasAnyRole("ACADEMICIAN", "HOD")
                        .requestMatchers("/availability-slots", "/availability-slots/**")
                                .hasAnyRole("ACADEMICIAN", "HOD")
                        .requestMatchers("/recurrence-rules", "/recurrence-rules/**")
                                .hasAnyRole("ACADEMICIAN", "HOD")
                        .requestMatchers("/calendar", "/calendar/**")
                                .hasAnyRole("ACADEMICIAN", "HOD")
                        .requestMatchers("/out-of-office", "/out-of-office/**")
                                .hasAnyRole("ACADEMICIAN", "HOD")
                        .requestMatchers(HttpMethod.GET, "/users")
                                .hasAnyRole("ACADEMICIAN", "HOD", "STUDENT")
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) ->
                                securityErrorWriter.write(
                                        request,
                                        response,
                                        HttpServletResponse.SC_UNAUTHORIZED,
                                        authException.getMessage() == null || authException.getMessage().isBlank()
                                                ? SecurityMessages.UNAUTHORIZED
                                                : authException.getMessage()))
                        .accessDeniedHandler((request, response, accessDeniedException) ->
                                securityErrorWriter.write(
                                        request,
                                        response,
                                        HttpServletResponse.SC_FORBIDDEN,
                                        SecurityMessages.ACCESS_DENIED))
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
