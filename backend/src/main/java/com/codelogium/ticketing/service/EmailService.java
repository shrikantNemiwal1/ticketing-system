package com.codelogium.ticketing.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Random;

@Service
@Slf4j
public class EmailService {

    private final Random random = new Random();

    /**
     * Generates a 6-digit OTP
     */
    public String generateOTP() {
        return String.format("%06d", random.nextInt(1000000));
    }

    /**
     * Sends OTP via email
     * In a real application, this would integrate with email services like:
     * - Amazon SES
     * - SendGrid
     * - JavaMail
     * 
     * For now, we'll just log the OTP for development purposes
     */
    public void sendOTP(String email, String otp) {
        log.info("=== EMAIL VERIFICATION ===");
        log.info("To: {}", email);
        log.info("OTP: {}", otp);
        log.info("Please enter this OTP to verify your email address.");
        log.info("===========================");

        // TODO: Implement actual email sending
        // Example integration points:
        // - AWS SES
        // - SendGrid API
        // - SMTP with JavaMail
    }

    /**
     * Sends welcome email after successful verification
     */
    public void sendWelcomeEmail(String email) {
        log.info("=== WELCOME EMAIL ===");
        log.info("To: {}", email);
        log.info("Welcome to IT Support Ticket System!");
        log.info("Your account has been verified and is ready to use.");
        log.info("===================");
    }
}
