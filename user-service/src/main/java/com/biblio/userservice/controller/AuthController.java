package com.biblio.userservice.controller;

import com.biblio.userservice.dto.RegisterRequest;
import com.biblio.userservice.dto.UserResponse;
import com.biblio.userservice.service.KeycloakAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller pour l'authentification et l'enregistrement
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final KeycloakAdminService keycloakAdminService;

    /**
     * Enregistre un nouvel utilisateur dans Keycloak et PostgreSQL
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            UserResponse userResponse = keycloakAdminService.registerUser(request);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Utilisateur enregistré avec succès");
            response.put("user", userResponse);
            response.put("info", "Vous pouvez maintenant vous connecter avec username: " + request.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Endpoint d'information pour le login
     * GET /api/auth/login-info
     */
    @GetMapping("/login-info")
    public ResponseEntity<?> loginInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("message", "Pour vous connecter, utilisez Keycloak");
        info.put("endpoint", "POST http://localhost:8180/realms/biblio/protocol/openid-connect/token");
        info.put("body", Map.of(
                "grant_type", "password",
                "client_id", "user-service-client",
                "username", "votre_username",
                "password", "votre_password"
        ));
        info.put("response", "Vous recevrez un access_token JWT à utiliser dans vos requêtes");
        return ResponseEntity.ok(info);
    }
}
