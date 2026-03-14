package com.fincoach.repository;

import com.fincoach.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {

    // Used after OAuth2 login to find an existing user by provider + provider's user ID
    Optional<User> findByProviderAndProviderId(String provider, String providerId);

    // Used as fallback when email is available but provider ID is not yet linked
    Optional<User> findByEmail(String email);

    // Used to verify email address via the token sent in the verification email
    Optional<User> findByEmailVerificationToken(String token);
}
