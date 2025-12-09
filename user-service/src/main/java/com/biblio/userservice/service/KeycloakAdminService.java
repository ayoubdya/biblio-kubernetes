package com.biblio.userservice.service;

import com.biblio.userservice.config.KeycloakAdminConfig;
import com.biblio.userservice.dto.RegisterRequest;
import com.biblio.userservice.dto.UserResponse;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

/**
 * Service pour gérer les utilisateurs via Keycloak Admin API
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakAdminService {

    private final KeycloakAdminConfig config;
    private final UserSyncService userSyncService;

    /**
     * Crée un client Keycloak Admin
     */
    private Keycloak getKeycloakClient() {
        return KeycloakBuilder.builder()
                .serverUrl(config.getServerUrl())
                .realm("master") // Se connecter au realm master pour avoir les droits admin
                .clientId("admin-cli")
                .username(config.getUsername())
                .password(config.getPassword())
                .build();
    }

    /**
     * Enregistre un nouvel utilisateur dans Keycloak et PostgreSQL
     */
    public UserResponse registerUser(RegisterRequest request) {
        Keycloak keycloak = null;
        try {
            keycloak = getKeycloakClient();
            RealmResource realmResource = keycloak.realm(config.getRealm());
            UsersResource usersResource = realmResource.users();

            // Vérifier si l'utilisateur existe déjà
            List<UserRepresentation> existingUsers = usersResource.search(request.getUsername(), true);
            if (!existingUsers.isEmpty()) {
                throw new RuntimeException("L'utilisateur " + request.getUsername() + " existe déjà");
            }

            // Créer la représentation de l'utilisateur
            UserRepresentation user = new UserRepresentation();
            user.setUsername(request.getUsername());
            user.setEmail(request.getEmail());
            user.setEnabled(true);
            user.setEmailVerified(true);

            // Créer le mot de passe
            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setValue(request.getPassword());
            credential.setTemporary(false);
            user.setCredentials(Collections.singletonList(credential));

            // Créer l'utilisateur dans Keycloak
            Response response = usersResource.create(user);
            
            if (response.getStatus() != 201) {
                throw new RuntimeException("Erreur lors de la création de l'utilisateur dans Keycloak: " + response.getStatusInfo());
            }

            // Récupérer l'ID de l'utilisateur créé
            String userId = response.getLocation().getPath().replaceAll(".*/([^/]+)$", "$1");
            log.info("Utilisateur {} créé dans Keycloak avec l'ID: {}", request.getUsername(), userId);

            // Assigner le rôle USER par défaut
            RoleRepresentation userRole = realmResource.roles().get("USER").toRepresentation();
            usersResource.get(userId).roles().realmLevel().add(Collections.singletonList(userRole));
            log.info("Rôle USER assigné à l'utilisateur {}", request.getUsername());

            // Synchroniser immédiatement dans PostgreSQL
            // On simule un JWT minimal pour la sync
            UserResponse userResponse = userSyncService.syncUserFromKeycloakManual(
                    request.getUsername(), 
                    request.getEmail(), 
                    Collections.singleton("USER")
            );
            
            log.info("Utilisateur {} synchronisé dans PostgreSQL", request.getUsername());
            
            response.close();
            return userResponse;
            
        } catch (Exception e) {
            log.error("Erreur lors de l'enregistrement de l'utilisateur: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de l'enregistrement: " + e.getMessage());
        } finally {
            if (keycloak != null) {
                keycloak.close();
            }
        }
    }
}
