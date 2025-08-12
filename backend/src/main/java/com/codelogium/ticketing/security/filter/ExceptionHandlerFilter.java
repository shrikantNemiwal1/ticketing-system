package com.codelogium.ticketing.security.filter;

import java.io.IOException;
import java.util.List;

import org.springframework.web.filter.OncePerRequestFilter;

import com.auth0.jwt.exceptions.JWTVerificationException;
import com.codelogium.ticketing.exception.ErrorResponse;
import com.codelogium.ticketing.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class ExceptionHandlerFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            filterChain.doFilter(request, response);
        } catch (ResourceNotFoundException e) {
            sendJsonErrorResponse(response, HttpServletResponse.SC_NOT_FOUND, "Username doesn't exist");
        } catch (JWTVerificationException e) {
            sendJsonErrorResponse(response, HttpServletResponse.SC_FORBIDDEN, "JWT token is invalid or expired");
        } catch (RuntimeException e) {
            sendJsonErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST, "Bad Request");
        }
    }

    public static void sendJsonErrorResponse(HttpServletResponse response, int status, String message) throws IOException {
        ErrorResponse errorResponse = new ErrorResponse(List.of(message));
        
        response.setStatus(status);
        response.setContentType("application/json");
        
        ObjectMapper objectMapper = new ObjectMapper();
        // Register JSR310 module to handle Java 8 time types
        objectMapper.findAndRegisterModules();
        String jsonResponse = objectMapper.writeValueAsString(errorResponse);
        
        response.getWriter().write(jsonResponse);
        response.getWriter().flush();
    }

    // Keep the old method for backward compatibility if used elsewhere
    public static void sendErrorResponse(HttpServletResponse response, int status, String message) throws IOException {
        sendJsonErrorResponse(response, status, message);
    }
}
