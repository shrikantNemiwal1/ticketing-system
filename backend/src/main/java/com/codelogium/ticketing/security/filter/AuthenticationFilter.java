package com.codelogium.ticketing.security.filter;

import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.codelogium.ticketing.entity.User;
import com.codelogium.ticketing.security.SecurityConstants;
import com.codelogium.ticketing.security.manager.CustomAuthenticationManager;
import com.codelogium.ticketing.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;

@AllArgsConstructor
public class AuthenticationFilter extends UsernamePasswordAuthenticationFilter {

    private CustomAuthenticationManager customAuthenticationManager;
    private UserService userService;

    // When the user visit /authenticate we will attempt to authenticate the user
    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
            throws AuthenticationException {

        try {
            /*
             * Deserializing the incoming data from the request to a User object made when
             * visiting /authenticate in order to grab the email and password
             */
            User user = new ObjectMapper().readValue(request.getInputStream(), User.class);

            Authentication authentication = new UsernamePasswordAuthenticationToken(user.getEmail(),
                    user.getPassword());
            /*
             * CustomAuthenticationManager will try to autenticate the created object
             * running authenticate(), one way hash the password and resend the object to
             * this if there's a match
             */
            return customAuthenticationManager.authenticate(authentication);
        } catch (IOException e) {
            throw new RuntimeException();
        }
    }

    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException failed) throws IOException, ServletException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.getWriter().write(failed.getMessage());
        response.getWriter().flush();
    }

    // In case of successful authentication send JWT
    @Override
    protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain chain,
            Authentication authResult) throws IOException, ServletException {

        List<String> authorities = authResult.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        String token = JWT.create()
                .withSubject(authResult.getName())
                .withClaim("authorities", authorities)
                .withExpiresAt(new Date(System.currentTimeMillis() + SecurityConstants.TOKEN_EXPIRATION))
                .sign(Algorithm.HMAC512(SecurityConstants.SECRET_KEY));

        // Get the user ID from the database by email
        String email = authResult.getName();
        User user = userService.retrieveUser(email);
        Long userId = user.getId();

        // Add token to header
        response.addHeader(SecurityConstants.AUTHORIZATION, SecurityConstants.BEARER + token);

        // Send token and user info in response body as JSON
        response.setContentType("application/json");
        response.setStatus(HttpServletResponse.SC_OK);

        // Create response JSON with token, email, authorities, and user ID
        String jsonResponse = "{\"token\":\"" + SecurityConstants.BEARER + token +
                "\",\"email\":\"" + email +
                "\",\"userId\":" + userId +
                ",\"authorities\":" + new ObjectMapper().writeValueAsString(authorities) +
                ",\"message\":\"Authentication successful\"}";
        response.getWriter().write(jsonResponse);
        response.getWriter().flush();
    }
}
