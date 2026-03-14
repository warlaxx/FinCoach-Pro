package com.fincoach.dto;

/**
 * Returned by /api/auth/login and /api/auth/register (after email verification).
 */
public class AuthResponse {

    private String token;
    private String userId;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private boolean emailVerified;
    private String message;

    public AuthResponse() {}

    public AuthResponse(String message) {
        this.message = message;
    }

    // --- Getters & Setters ---

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
