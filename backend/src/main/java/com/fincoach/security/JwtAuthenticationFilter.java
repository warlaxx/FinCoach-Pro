package com.fincoach.security;

import com.fincoach.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Intercepts every incoming HTTP request and checks for a valid JWT.
 *
 * The filter runs ONCE per request (OncePerRequestFilter guarantees this,
 * even when the request is forwarded internally by Spring).
 *
 * Flow:
 * 1. Read the "Authorization" header — expected format: "Bearer {token}"
 * 2. If present and valid, parse the JWT and set the SecurityContext
 * 3. The SecurityContext tells Spring Security who the current user is
 * 4. If no valid token, do nothing — Spring will reject the request as 401
 *    if the endpoint requires authentication
 *
 * Why UsernamePasswordAuthenticationToken?
 * It's the standard Spring Security token for authenticated requests.
 * The first argument is the "principal" (userId), the second is credentials (null
 * since we already validated the JWT), and the third is authorities/roles.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // No token present — let Spring Security decide if the endpoint is public or protected
            chain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7); // Strip "Bearer " prefix

        if (jwtService.isValid(token)) {
            String userId = jwtService.getUserId(token);
            Claims claims = jwtService.getClaims(token);

            // Build the authentication object and store it in the SecurityContext
            // From this point on, any call to SecurityContextHolder.getContext().getAuthentication()
            // in controllers/services will return this object
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    userId,
                    null, // credentials not needed — JWT is already validated
                    List.of(new SimpleGrantedAuthority("ROLE_USER"))
            );
            auth.setDetails(claims); // Attach full claims so controllers can access email, name, etc.
            SecurityContextHolder.getContext().setAuthentication(auth);

            log.debug("JWT authenticated userId={} for {} {}", userId, request.getMethod(), request.getRequestURI());
        } else {
            log.debug("Invalid or expired JWT for {} {}", request.getMethod(), request.getRequestURI());
        }

        chain.doFilter(request, response);
    }
}
