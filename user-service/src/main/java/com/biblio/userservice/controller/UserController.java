package com.biblio.userservice.controller;

import com.biblio.userservice.dto.RegisterRequest;
import com.biblio.userservice.dto.UpdateUserRequest;
import com.biblio.userservice.dto.UserResponse;
import com.biblio.userservice.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            UserResponse user = userService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        try {
            UserResponse user = userService.updateUser(id, request);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(Map.of(
                "message", "User disabled successfully (soft delete)",
                "info", "L'utilisateur a été désactivé et ne peut plus se connecter"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/roles/{role}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addRole(@PathVariable Long id, @PathVariable String role) {
        try {
            UserResponse user = userService.addRoleToUser(id, role);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/roles/{role}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> removeRole(@PathVariable Long id, @PathVariable String role) {
        try {
            UserResponse user = userService.removeRoleFromUser(id, role);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
