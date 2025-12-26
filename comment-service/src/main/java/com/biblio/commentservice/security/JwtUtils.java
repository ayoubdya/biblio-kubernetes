package com.biblio.commentservice.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class JwtUtils {

  public Optional<AuthenticatedUser> getCurrentUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

    if (authentication != null && authentication.isAuthenticated()
        && authentication.getPrincipal() instanceof Jwt jwt) {

      return Optional.of(AuthenticatedUser.builder()
          .userId(jwt.getSubject())
          .username(jwt.getClaimAsString("preferred_username"))
          .email(jwt.getClaimAsString("email"))
          .build());
    }

    return Optional.empty();
  }

  public String getCurrentUserId() {
    return getCurrentUser()
        .map(AuthenticatedUser::getUserId)
        .orElseThrow(() -> new IllegalStateException("No authenticated user found"));
  }

  public String getCurrentUsername() {
    return getCurrentUser()
        .map(AuthenticatedUser::getUsername)
        .orElseThrow(() -> new IllegalStateException("No authenticated user found"));
  }

  public AuthenticatedUser fromJwt(Jwt jwt) {
    return AuthenticatedUser.builder()
        .userId(jwt.getSubject())
        .username(jwt.getClaimAsString("preferred_username"))
        .email(jwt.getClaimAsString("email"))
        .build();
  }
}
