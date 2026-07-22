package com.mars.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "mars.mail")
public record MarsMailProperties(String from) {
}
