package com.fincoach.dto;

import jakarta.validation.constraints.*;

/**
 * Payload for POST /api/auth/register.
 */
public class RegisterRequest {

    @NotBlank(message = "L'adresse e-mail est obligatoire")
    @Email(message = "Format d'e-mail invalide")
    private String email;

    @NotBlank(message = "Le prénom est obligatoire")
    @Size(min = 2, max = 100, message = "Le prénom doit contenir entre 2 et 100 caractères")
    private String firstName;

    @NotBlank(message = "Le nom de famille est obligatoire")
    @Size(min = 2, max = 100, message = "Le nom de famille doit contenir entre 2 et 100 caractères")
    private String lastName;

    @NotNull(message = "L'âge est obligatoire")
    @Min(value = 16, message = "Vous devez avoir au moins 16 ans")
    @Max(value = 120, message = "Âge invalide")
    private Integer age;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String password;

    // --- Getters & Setters ---

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
