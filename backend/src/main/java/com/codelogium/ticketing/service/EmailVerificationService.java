package com.codelogium.ticketing.service;

import com.codelogium.ticketing.dto.EmailVerificationDTO;
import com.codelogium.ticketing.entity.EmailVerification;
import com.codelogium.ticketing.entity.User;
import com.codelogium.ticketing.exception.ResourceNotFoundException;
import com.codelogium.ticketing.repository.EmailVerificationRepository;
import com.codelogium.ticketing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailVerificationRepository emailVerificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    private static final int OTP_VALIDITY_MINUTES = 10;

    /**
     * Sends OTP for email verification
     */
    @Transactional
    public void sendVerificationOTP(String email) {
        // Check if user exists and is not verified
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new ResourceNotFoundException("User not found with email: " + email);
        }

        User user = userOpt.get();
        if (user.isEmailVerified()) {
            throw new IllegalStateException("Email is already verified");
        }

        // Delete any existing unverified OTP for this email
        emailVerificationRepository.findByEmailAndVerifiedFalse(email)
                .ifPresent(emailVerificationRepository::delete);

        // Generate new OTP
        String otp = emailService.generateOTP();
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(OTP_VALIDITY_MINUTES);

        // Save OTP
        EmailVerification verification = new EmailVerification(email, otp, expiryTime);
        emailVerificationRepository.save(verification);

        // Send email
        emailService.sendOTP(email, otp);
    }

    /**
     * Verifies OTP and activates user account
     */
    @Transactional
    public void verifyEmail(EmailVerificationDTO verificationDTO) {
        // Find verification record
        Optional<EmailVerification> verificationOpt = emailVerificationRepository
                .findByEmailAndOtpAndVerifiedFalse(verificationDTO.getEmail(), verificationDTO.getOtp());

        if (verificationOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid OTP or email");
        }

        EmailVerification verification = verificationOpt.get();

        // Check if OTP is expired
        if (verification.isExpired()) {
            emailVerificationRepository.delete(verification);
            throw new IllegalArgumentException("OTP has expired. Please request a new one");
        }

        // Mark verification as completed
        verification.setVerified(true);
        emailVerificationRepository.save(verification);

        // Update user's email verification status
        User user = userRepository.findByEmail(verificationDTO.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setEmailVerified(true);
        userRepository.save(user);

        // Send welcome email
        emailService.sendWelcomeEmail(user.getEmail());

        // Clean up verified records
        emailVerificationRepository.deleteByEmailAndVerifiedTrue(verificationDTO.getEmail());
    }

    /**
     * Resends OTP for email verification
     */
    public void resendVerificationOTP(String email) {
        sendVerificationOTP(email);
    }

    /**
     * Cleans up expired OTP records (can be called by scheduled job)
     */
    @Transactional
    public void cleanupExpiredOTPs() {
        emailVerificationRepository.deleteByExpiryTimeBefore(LocalDateTime.now());
    }
}
