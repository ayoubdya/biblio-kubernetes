package com.biblio.commentservice.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

import java.time.Instant;
import java.util.Map;

@TestConfiguration
@EnableWebSecurity
public class TestSecurityConfig {

  @Bean
  @Primary
  public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .authorizeHttpRequests(auth -> auth
            .anyRequest().permitAll());
    return http.build();
  }

  @Bean
  @Primary
  public JwtDecoder jwtDecoder() {
    return token -> Jwt.withTokenValue(token)
        .header("alg", "RS256")
        .subject("test-user")
        .claim("preferred_username", "testuser")
        .claim("email", "test@example.com")
        .issuedAt(Instant.now())
        .expiresAt(Instant.now().plusSeconds(3600))
        .build();
  }
}
