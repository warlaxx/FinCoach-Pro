package com.fincoach.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Represents an authenticated user.
 * Created on first OAuth2 login, updated on subsequent logins.
 * The id field is our own UUID — NOT the provider's sub claim — so a user
 * can later link multiple providers (Google + Microsoft) to the same account.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    private String id;

    @Column(unique = true, nullable = false)
    private String email;

    private String name;

    // URL of the user's avatar from Google/Microsoft (Apple does not provide one)
    private String pictureUrl;

    // GOOGLE, MICROSOFT, or APPLE
    private String provider;

    // The "sub" claim from the provider's OIDC token (unique per user per provider)
    private String providerId;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public User() {
    }

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

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPictureUrl() { return pictureUrl; }
    public void setPictureUrl(String pictureUrl) { this.pictureUrl = pictureUrl; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getProviderId() { return providerId; }
    public void setProviderId(String providerId) { this.providerId = providerId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
