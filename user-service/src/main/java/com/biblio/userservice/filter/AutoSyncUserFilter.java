package com.biblio.userservice.filter;

import com.biblio.userservice.service.UserSyncService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Filtre qui synchronise automatiquement les utilisateurs Keycloak vers PostgreSQL
 * au premier accès à n'importe quel endpoint protégé.
 * 
 * Ce filtre s'exécute après l'authentification JWT et avant le traitement de la requête.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AutoSyncUserFilter extends OncePerRequestFilter {

    private final UserSyncService userSyncService;
    
    // Cache en mémoire pour éviter la synchronisation répétée
    // ConcurrentHashMap pour thread-safety
    private final ConcurrentHashMap<String, Boolean> syncedUsers = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        // Récupérer l'authentification courante
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // Vérifier si l'utilisateur est authentifié avec un JWT
        if (authentication != null && authentication.isAuthenticated() 
                && authentication.getPrincipal() instanceof Jwt) {
            
            Jwt jwt = (Jwt) authentication.getPrincipal();
            String username = jwt.getClaimAsString("preferred_username");
            String email = jwt.getClaimAsString("email");
            
            // Synchroniser seulement si c'est la première fois (pas dans le cache)
            if (username != null && !syncedUsers.containsKey(username)) {
                try {
                    log.debug("First access detected for user: {}, syncing to PostgreSQL", username);
                    userSyncService.syncUserFromKeycloak(username, email, jwt);
                    // Marquer comme synchronisé dans le cache
                    syncedUsers.put(username, Boolean.TRUE);
                    log.debug("User {} synchronized successfully and cached", username);
                } catch (Exception e) {
                    // En cas d'erreur, on log mais on laisse la requête continuer
                    log.warn("Failed to auto-sync user {}: {}", username, e.getMessage());
                }
            }
        }
        
        // Continuer le traitement de la requête
        filterChain.doFilter(request, response);
    }
    
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Ne pas appliquer ce filtre aux endpoints publics
        String path = request.getRequestURI();
        return path.startsWith("/actuator") || 
               path.startsWith("/api/auth") ||
               path.startsWith("/error");
    }
}
