package com.fincoach.security;

import com.fincoach.model.User;
import com.fincoach.repository.UserRepository;
import com.fincoach.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Called by Spring Security immediately after a successful OAuth2 login.
 *
 * What we do here:
 * 1. Extract the authenticated OIDC user from the Authentication object
 * 2. Look up the User record we saved in CustomOidcUserService
 * 3. Generate our own JWT (not the provider's token — our app token)
 * 4. Redirect the browser to the Angular frontend with the JWT in the URL
 *
 * The frontend's /auth/callback route will extract the token from the URL,
 * store it in localStorage, and then navigate to the dashboard.
 *
 * Why put the token in the URL? Because this is a browser redirect (not an AJAX
 * request), so we can't set HTTP headers. The URL is the standard way to pass
 * data across a redirect in OAuth2 flows.
 */
@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2SuccessHandler.class);

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepo;

    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OidcUser oidcUser = (OidcUser) authentication.getPrincipal();
        String provider = ((OAuth2AuthenticationToken) authentication)
                .getAuthorizedClientRegistrationId().toUpperCase();
        String providerId = oidcUser.getSubject();

        User user = userRepo.findByProviderAndProviderId(provider, providerId)
                .orElseThrow(() -> new IllegalStateException(
                        "User not found after OAuth2 success for provider=" + provider + " id=" + providerId));

        String token = jwtService.generateToken(user);
        log.info("OAuth2 success for userId={} ({}), redirecting to frontend", user.getId(), user.getEmail());

        // Redirect to Angular with the JWT in the query string
        // Angular's AuthCallbackComponent will pick it up
        response.sendRedirect(frontendUrl + "/auth/callback?token=" + token);
    }
}
