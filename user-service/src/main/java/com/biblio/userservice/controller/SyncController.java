package com.biblio.userservice.controller;

import com.biblio.userservice.dto.UserResponse;
import com.biblio.userservice.service.UserSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Endpoint pour synchroniser automatiquement les utilisateurs Keycloak vers PostgreSQL
 */
@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class SyncController {

    private final UserSyncService userSyncService;

    /**
     * Synchronise l'utilisateur authentifié depuis Keycloak vers PostgreSQL
     * Cet endpoint doit être appelé après l'obtention du JWT depuis Keycloak
     * 
     * @param jwt Le JWT token fourni par Keycloak
     * @return Les informations de l'utilisateur synchronisé
     */
    @PostMapping("/user")
    public ResponseEntity<?> syncCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        try {
            // Extraire les informations du JWT Keycloak
            String username = jwt.getClaimAsString("preferred_username");
            String email = jwt.getClaimAsString("email");
            
            // Synchroniser l'utilisateur dans PostgreSQL
            UserResponse userResponse = userSyncService.syncUserFromKeycloak(username, email, jwt);
            
            return ResponseEntity.ok(Map.of(
                "message", "User synchronized successfully",
                "user", userResponse
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
