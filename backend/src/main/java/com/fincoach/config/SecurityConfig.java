package com.fincoach.config;

import com.fincoach.security.AppleClientSecretGenerator;
import com.fincoach.security.CustomOidcUserService;
import com.fincoach.security.JwtAuthenticationFilter;
import com.fincoach.security.OAuth2FailureHandler;
import com.fincoach.security.OAuth2SuccessHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.IdTokenClaimNames;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.web.OAuth2LoginAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;

import java.util.ArrayList;
import java.util.List;

/**
 * Central Spring Security configuration.
 *
 * Key decisions:
 * - CSRF disabled: we use JWT (stateless), so CSRF attacks are not applicable
 * - Session policy STATELESS for /api/** but ALLOW session for OAuth2 flow
 *   (Spring needs a short-lived session to store the OAuth2 "state" parameter
 *    during the provider redirect — this prevents CSRF on the OAuth2 flow itself)
 * - OAuth2 providers are registered dynamically: only providers with non-empty
 *   credentials are registered, so the app starts even without Apple credentials
 * - Unauthenticated API requests get 401 JSON (not a redirect to a login page)
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    @Autowired
    private JwtAuthenticationFilter jwtFilter;

    @Autowired
    private OAuth2SuccessHandler successHandler;

    @Autowired
    private OAuth2FailureHandler failureHandler;

    @Autowired
    private CustomOidcUserService oidcUserService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                    CorsConfig corsConfig) throws Exception {
        http
            // Use the CorsConfig bean so CORS is applied before Spring Security filters
            .cors(cors -> cors.configurationSource(corsConfig.corsConfigurationSource()))

            // Disable CSRF: not needed with JWT (tokens are not sent automatically by browsers)
            .csrf(AbstractHttpConfigurer::disable)

            // Configure which endpoints are public and which require authentication
            .authorizeHttpRequests(auth -> auth
                // OAuth2 flow endpoints — must be public (browser navigates here without a JWT)
                .requestMatchers("/login/oauth2/**", "/oauth2/**").permitAll()
                // Auth endpoints — registration, login, email verification, and current user
                .requestMatchers("/api/auth/**").permitAll()
                // Spring Boot error endpoint — must be public so error responses
                // are not masked by a 401 when exceptions occur in public endpoints
                .requestMatchers("/error").permitAll()
                // Everything else requires a valid JWT
                .anyRequest().authenticated()
            )

            // When an unauthenticated request hits a protected endpoint, return 401
            // instead of redirecting to a login page (Angular handles the redirect)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) -> {
                    log.warn("Unauthorized access attempt: {} {}", req.getMethod(), req.getRequestURI());
                    res.sendError(401, "Unauthorized - please log in");
                })
            )

            // Configure OAuth2 login
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(ui -> ui.oidcUserService(oidcUserService))
                .successHandler(successHandler)
                .failureHandler(failureHandler)
            )

            // Add our JWT filter before Spring's built-in OAuth2 filter
            // This means JWT auth is checked first on every request
            .addFilterBefore(jwtFilter, OAuth2LoginAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Builds the OAuth2 client registration repository dynamically.
     * Only registers providers that have non-empty client credentials.
     * This allows the app to start and run with just Google, just Microsoft,
     * or any combination — without needing all three configured.
     */
    @Bean
    public ClientRegistrationRepository clientRegistrationRepository(
            @Value("${GOOGLE_CLIENT_ID:}") String googleId,
            @Value("${GOOGLE_CLIENT_SECRET:}") String googleSecret,
            @Value("${MICROSOFT_CLIENT_ID:}") String msId,
            @Value("${MICROSOFT_CLIENT_SECRET:}") String msSecret,
            @Value("${APPLE_CLIENT_ID:}") String appleId,
            @Value("${apple.team-id:}") String appleTeamId,
            @Value("${apple.key-id:}") String appleKeyId,
            @Value("${apple.private-key:}") String applePrivateKey) {

        List<ClientRegistration> registrations = new ArrayList<>();

        // --- Google (standard OIDC, CommonOAuth2Provider handles all endpoints) ---
        if (!googleId.isBlank()) {
            registrations.add(
                org.springframework.security.config.oauth2.client.CommonOAuth2Provider.GOOGLE
                    .getBuilder("google")
                    .clientId(googleId)
                    .clientSecret(googleSecret)
                    .scope("openid", "profile", "email")
                    .build()
            );
            log.info("OAuth2 provider registered: Google");
        }

        // --- Microsoft (manual OIDC config — not in CommonOAuth2Provider) ---
        if (!msId.isBlank()) {
            registrations.add(ClientRegistration.withRegistrationId("microsoft")
                .clientId(msId)
                .clientSecret(msSecret)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .scope("openid", "profile", "email")
                // "common" tenant = accepts both personal (Hotmail) and work (Azure AD) accounts
                .authorizationUri("https://login.microsoftonline.com/common/oauth2/v2.0/authorize")
                .tokenUri("https://login.microsoftonline.com/common/oauth2/v2.0/token")
                .jwkSetUri("https://login.microsoftonline.com/common/discovery/v2.0/keys")
                .userInfoUri("https://graph.microsoft.com/oidc/userinfo")
                .userNameAttributeName(IdTokenClaimNames.SUB)
                .clientName("Microsoft")
                .build()
            );
            log.info("OAuth2 provider registered: Microsoft");
        }

        // --- Apple (special: client_secret is a JWT signed with the Apple private key) ---
        if (!appleId.isBlank() && !appleTeamId.isBlank() && !appleKeyId.isBlank() && !applePrivateKey.isBlank()) {
            // Generate the Apple client_secret JWT (valid for 6 months)
            String appleSecret = AppleClientSecretGenerator.generate(appleTeamId, appleId, appleKeyId, applePrivateKey);
            registrations.add(ClientRegistration.withRegistrationId("apple")
                .clientId(appleId)
                .clientSecret(appleSecret)
                // Apple requires the client_secret in the POST body (not in the Authorization header)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .scope("openid", "name", "email")
                // form_post: Apple sends the auth code via POST (required when requesting name/email scopes)
                .authorizationUri("https://appleid.apple.com/auth/authorize?response_mode=form_post")
                .tokenUri("https://appleid.apple.com/auth/token")
                .jwkSetUri("https://appleid.apple.com/auth/keys")
                .userNameAttributeName(IdTokenClaimNames.SUB)
                .clientName("Apple")
                .build()
            );
            log.info("OAuth2 provider registered: Apple");
        }

        if (registrations.isEmpty()) {
            log.warn("No OAuth2 providers configured! Set GOOGLE_CLIENT_ID, MICROSOFT_CLIENT_ID, " +
                     "or APPLE_CLIENT_ID environment variables to enable login.");
            // Return a placeholder to avoid InMemoryClientRegistrationRepository failing on empty list
            return new InMemoryClientRegistrationRepository(
                ClientRegistration.withRegistrationId("unconfigured")
                    .clientId("unconfigured")
                    .clientSecret("unconfigured")
                    .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                    .redirectUri("{baseUrl}/login/oauth2/code/unconfigured")
                    .authorizationUri("http://localhost")
                    .tokenUri("http://localhost")
                    .build()
            );
        }

        return new InMemoryClientRegistrationRepository(registrations);
    }

    /**
     * BCrypt password encoder used for hashing and verifying LOCAL account passwords.
     * Strength 12 is a good balance between security and registration latency (~200-400ms).
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
