package com.codelogium.ticketing.web;

import com.codelogium.ticketing.dto.EmailVerificationDTO;
import com.codelogium.ticketing.dto.UserRegistrationDTO;
import com.codelogium.ticketing.entity.User;
import com.codelogium.ticketing.entity.enums.UserRole;
import com.codelogium.ticketing.service.EmailVerificationService;
import com.codelogium.ticketing.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "User Registration & Verification", description = "Endpoints for user registration and email verification")
public class UserRegistrationController {

    private final UserService userService;
    private final EmailVerificationService emailVerificationService;
    private final BCryptPasswordEncoder passwordEncoder;

    @PostMapping("/register")
    @Operation(summary = "Register new user", description = "Register a new user account. Email verification required.")
    public ResponseEntity<Map<String, String>> registerUser(@Valid @RequestBody UserRegistrationDTO registrationDTO) {

        // Check if user already exists
        if (userService.existsByEmail(registrationDTO.getEmail())) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "User with this email already exists");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }

        // Create new user (unverified)
        User user = new User();
        user.setEmail(registrationDTO.getEmail());
        user.setPassword(passwordEncoder.encode(registrationDTO.getPassword()));
        user.setRole(UserRole.USER);
        user.setEmailVerified(false);

        // Save user
        userService.saveUser(user);

        // Send verification email
        emailVerificationService.sendVerificationOTP(registrationDTO.getEmail());

        Map<String, String> response = new HashMap<>();
        response.put("message", "User registered successfully. Please check your email for verification OTP.");
        response.put("email", registrationDTO.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify email with OTP", description = "Verify user email address using OTP")
    public ResponseEntity<Map<String, String>> verifyEmail(@Valid @RequestBody EmailVerificationDTO verificationDTO) {

        emailVerificationService.verifyEmail(verificationDTO);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Email verified successfully. You can now login.");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-otp")
    @Operation(summary = "Resend verification OTP", description = "Resend OTP for email verification")
    public ResponseEntity<Map<String, String>> resendOTP(@RequestParam String email) {

        emailVerificationService.resendVerificationOTP(email);

        Map<String, String> response = new HashMap<>();
        response.put("message", "OTP sent successfully. Please check your email.");

        return ResponseEntity.ok(response);
    }
}
