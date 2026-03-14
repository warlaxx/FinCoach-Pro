package com.fincoach.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Payload for POST /api/auth/login.
 */
public class LoginRequest {

    @NotBlank(message = "L'adresse e-mail est obligatoire")
    @Email(message = "Format d'e-mail invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    private String password;

    // --- Getters & Setters ---

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
