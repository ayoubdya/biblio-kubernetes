package com.biblio.userservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration Keycloak Admin Client
 */
@Configuration
@ConfigurationProperties(prefix = "keycloak.admin")
@Data
public class KeycloakAdminConfig {
    
    private String serverUrl;
    private String realm;
    private String clientId;
    private String username;
    private String password;
}
