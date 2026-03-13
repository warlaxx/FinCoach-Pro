package com.fincoach.security;

import com.fincoach.model.User;
import com.fincoach.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

/**
 * Called by Spring Security after a provider (Google, Microsoft, Apple) validates the user.
 *
 * Flow:
 * 1. Spring calls super.loadUser() which fetches user info from the provider's userinfo endpoint
 * 2. We extract email, name, picture from the OIDC claims
 * 3. We look up the user in our database (by provider + providerId)
 * 4. We create a new User record if this is a first login, or update the existing one
 * 5. We return the OidcUser so Spring can continue its authentication flow
 *
 * After this method returns, Spring Security calls our OAuth2SuccessHandler.
 */
@Service
public class CustomOidcUserService extends OidcUserService {

    private static final Logger log = LoggerFactory.getLogger(CustomOidcUserService.class);

    @Autowired
    private UserRepository userRepo;

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        // Let Spring do the heavy lifting: fetch userinfo, validate ID token, build OidcUser
        OidcUser oidcUser = super.loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId().toUpperCase();
        String providerId = oidcUser.getSubject(); // "sub" claim — unique user ID at the provider
        String email = oidcUser.getEmail();
        String name = oidcUser.getFullName();
        String picture = oidcUser.getPicture();

        // Apple: email may come from the ID token claims rather than userinfo endpoint
        if (email == null) {
            email = oidcUser.getAttribute("email");
        }

        // Apple: name is only returned on the VERY FIRST login (in the form_post body).
        // On subsequent logins, it's not available. We fall back to the email prefix.
        if (name == null || name.isBlank()) {
            name = (email != null) ? email.split("@")[0] : "User";
        }

        log.info("OAuth2 login - provider={}, email={}, providerId={}", provider, email, providerId);

        // Find existing user or prepare a new one
        final String finalEmail = email;
        final String finalName = name;
        final String finalPicture = picture;

        User user = userRepo.findByProviderAndProviderId(provider, providerId)
                .orElseGet(() -> {
                    log.info("First login for {} via {} — creating new user", finalEmail, provider);
                    User newUser = new User();
                    newUser.setProvider(provider);
                    newUser.setProviderId(providerId);
                    return newUser;
                });

        // Always update profile info (name/picture can change on the provider side)
        user.setEmail(finalEmail);
        user.setName(finalName);
        user.setPictureUrl(finalPicture);
        userRepo.save(user);

        log.info("User {} saved (id={}, provider={})", finalEmail, user.getId(), provider);
        return oidcUser;
    }
}
