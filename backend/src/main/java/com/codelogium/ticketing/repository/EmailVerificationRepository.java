package com.codelogium.ticketing.repository;

import com.codelogium.ticketing.entity.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {

    Optional<EmailVerification> findByEmailAndOtpAndVerifiedFalse(String email, String otp);

    Optional<EmailVerification> findByEmailAndVerifiedFalse(String email);

    void deleteByEmailAndVerifiedTrue(String email);

    void deleteByExpiryTimeBefore(LocalDateTime dateTime);
}
