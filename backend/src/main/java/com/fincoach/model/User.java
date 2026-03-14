package com.fincoach.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Represents a FinCoach Pro user account.
 *
 * Supports two authentication modes:
 *  - OAuth2 (Google, Microsoft, Apple): provider + providerId set, passwordHash null
 *  - Email/password (LOCAL): provider = "LOCAL", passwordHash set, emailVerified managed manually
 *
 * Fields added compared to the original model:
 *  - firstName, lastName, age     : personal info collected at registration
 *  - passwordHash                 : BCrypt hash for LOCAL accounts
 *  - role                         : USER | PREMIUM | ADMIN
 *  - emailVerified                : false until the user clicks the verification link
 *  - emailVerificationToken       : random UUID sent in the verification email
 *  - subscriptionStartedAt        : timestamp when the user activated a paid subscription
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    private String id;

    @Column(unique = true, nullable = false)
    private String email;

    // Personal info
    private String firstName;
    private String lastName;
    private Integer age;

    // OAuth2 display name / avatar (kept for OAuth2 compatibility)
    private String name;
    private String pictureUrl;

    // Password (BCrypt) — null for OAuth2 users
    private String passwordHash;

    // OAuth2 provider info
    private String provider;   // GOOGLE | MICROSOFT | APPLE | LOCAL
    private String providerId; // "sub" claim from the provider

    // Access control
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;

    // Email verification
    @Column(nullable = false)
    private boolean emailVerified = false;

    private String emailVerificationToken;

    // Timestamps
    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime subscriptionStartedAt;

    public User() {}

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // --- Getters & Setters ---

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPictureUrl() { return pictureUrl; }
    public void setPictureUrl(String pictureUrl) { this.pictureUrl = pictureUrl; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getProviderId() { return providerId; }
    public void setProviderId(String providerId) { this.providerId = providerId; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }

    public String getEmailVerificationToken() { return emailVerificationToken; }
    public void setEmailVerificationToken(String emailVerificationToken) {
        this.emailVerificationToken = emailVerificationToken;
    }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public LocalDateTime getSubscriptionStartedAt() { return subscriptionStartedAt; }
    public void setSubscriptionStartedAt(LocalDateTime subscriptionStartedAt) {
        this.subscriptionStartedAt = subscriptionStartedAt;
    }

    /** Returns the best display name available (firstName lastName > name > email prefix). */
    public String getDisplayName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        }
        if (name != null && !name.isBlank()) {
            return name;
        }
        return email != null ? email.split("@")[0] : "User";
    }
}
