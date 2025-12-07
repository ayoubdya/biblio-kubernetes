package com.biblio.userservice.dto;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class UpdateUserRequest {
    private String username;
    
    @Email(message = "Email should be valid")
    private String email;
    
    private String password; // Optional - only if user wants to change password
    
    private Boolean enabled;
}
