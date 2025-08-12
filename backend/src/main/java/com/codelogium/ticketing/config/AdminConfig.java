package com.codelogium.ticketing.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "app.admin")
public class AdminConfig {
    private String password = "admin123";
    private String email = "admin@ticketing.com";
    private boolean createOnStartup = true;
}
