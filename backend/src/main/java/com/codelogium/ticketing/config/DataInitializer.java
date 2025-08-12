package com.codelogium.ticketing.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.codelogium.ticketing.entity.User;
import com.codelogium.ticketing.entity.enums.UserRole;
import com.codelogium.ticketing.repository.UserRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AdminConfig adminConfig;

    @Override
    public void run(String... args) throws Exception {
        if (adminConfig.isCreateOnStartup()) {
            createDefaultAdminUser();
        }
    }

    private void createDefaultAdminUser() {
        try {
            // Check if admin user already exists
            if (userRepository.findByEmail(adminConfig.getEmail()).isPresent()) {
                logger.info("Default admin user '{}' already exists. Skipping creation.",
                        adminConfig.getEmail());
                return;
            }

            // Create default admin user
            User adminUser = new User();
            adminUser.setPassword(passwordEncoder.encode(adminConfig.getPassword()));
            adminUser.setEmail(adminConfig.getEmail());
            adminUser.setRole(UserRole.ADMIN);
            adminUser.setEmailVerified(true); // Admin accounts are pre-verified

            userRepository.save(adminUser);

            logger.info("✅ Default admin user created successfully!");
            logger.info("📧 Admin Email: {}", adminConfig.getEmail());
            logger.warn("🔐 Please change the default password after first login!");

        } catch (Exception e) {
            logger.error("❌ Failed to create default admin user: {}", e.getMessage(), e);
        }
    }
}
