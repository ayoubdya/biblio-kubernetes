package com.biblio.userservice.service;

import com.biblio.userservice.dto.UserResponse;
import com.biblio.userservice.entity.User;
import com.biblio.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Service pour synchroniser les utilisateurs Keycloak vers PostgreSQL
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserSyncService {

    private final UserRepository userRepository;

    /**
     * Synchronise un utilisateur Keycloak vers PostgreSQL
     * Si l'utilisateur existe déjà, ses informations sont mises à jour
     * Sinon, un nouveau user est créé
     * 
     * @param username Le nom d'utilisateur depuis Keycloak
     * @param email L'email depuis Keycloak
     * @param jwt Le JWT contenant les rôles et autres informations
     * @return L'utilisateur synchronisé
     */
    @Transactional
    public UserResponse syncUserFromKeycloak(String username, String email, Jwt jwt) {
        log.info("Synchronizing user from Keycloak: {}", username);
        
        // Vérifier si l'utilisateur existe déjà
        Optional<User> existingUser = userRepository.findByUsername(username);
        
        User user;
        if (existingUser.isPresent()) {
            // Mettre à jour l'utilisateur existant
            user = existingUser.get();
            log.info("User already exists, updating: {}", username);
        } else {
            // Créer un nouvel utilisateur
            user = new User();
            user.setUsername(username);
            // Pas de mot de passe car l'authentification se fait via Keycloak
            user.setPassword(UUID.randomUUID().toString()); // Valeur aléatoire, ne sera jamais utilisée
            log.info("Creating new user from Keycloak: {}", username);
        }
        
        // Mettre à jour les informations
        user.setEmail(email);
        user.setEnabled(true);
        
        // Extraire les rôles depuis le JWT Keycloak
        List<String> realmRoles = jwt.getClaimAsStringList("realm_access.roles");
        if (realmRoles == null) {
            // Essayer une autre structure du JWT
            realmRoles = extractRolesFromJwt(jwt);
        }
        
        // Assigner les rôles en fonction des rôles Keycloak
        Set<String> userRoles = new HashSet<>();
        if (realmRoles != null) {
            // Garder uniquement les rôles USER et ADMIN
            for (String role : realmRoles) {
                if (role.equals("USER") || role.equals("ADMIN")) {
                    userRoles.add(role);
                }
            }
        }
        // Par défaut, assigner le rôle USER si aucun rôle n'est trouvé
        if (userRoles.isEmpty()) {
            userRoles.add("USER");
        }
        user.setRoles(userRoles);
        
        // Sauvegarder
        user = userRepository.save(user);
        log.info("User synchronized successfully: {} with roles {}", username, user.getRoles());
        
        return mapToResponse(user);
    }
    
    /**
     * Extrait les rôles depuis le JWT Keycloak
     * La structure peut varier selon la configuration Keycloak
     */
    @SuppressWarnings("unchecked")
    private List<String> extractRolesFromJwt(Jwt jwt) {
        try {
            Object realmAccess = jwt.getClaim("realm_access");
            if (realmAccess instanceof java.util.Map) {
                java.util.Map<String, Object> realmAccessMap = (java.util.Map<String, Object>) realmAccess;
                Object roles = realmAccessMap.get("roles");
                if (roles instanceof List) {
                    return (List<String>) roles;
                }
            }
        } catch (Exception e) {
            log.warn("Could not extract roles from JWT: {}", e.getMessage());
        }
        return null;
    }
    
    private UserResponse mapToResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRoles(),
                user.isEnabled()
        );
    }
    
    /**
     * Synchronise un utilisateur manuellement (pour le register)
     * Sans JWT, juste avec username, email et roles
     */
    @Transactional
    public UserResponse syncUserFromKeycloakManual(String username, String email, Set<String> roles) {
        log.info("Manual synchronization of user: {}", username);
        
        Optional<User> existingUser = userRepository.findByUsername(username);
        
        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            log.info("User already exists, updating: {}", username);
        } else {
            user = new User();
            user.setUsername(username);
            user.setPassword(UUID.randomUUID().toString()); // Mot de passe aléatoire
            log.info("Creating new user from manual sync: {}", username);
        }
        
        user.setEmail(email);
        user.setEnabled(true);
        user.setRoles(roles);
        
        user = userRepository.save(user);
        log.info("User synchronized successfully: {} with roles {}", username, user.getRoles());
        
        return mapToResponse(user);
    }
}
