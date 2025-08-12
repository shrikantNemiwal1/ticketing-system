package com.codelogium.ticketing.security.rbac;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.codelogium.ticketing.entity.User;
import com.codelogium.ticketing.exception.ResourceNotFoundException;
import com.codelogium.ticketing.repository.UserRepository;

@Service
public class CustomUserDetailsServiceImp implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsServiceImp(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check if email is verified
        if (!user.isEmailVerified()) {
            throw new UsernameNotFoundException("Email not verified. Please verify your email before logging in.");
        }

        return new CustomUserDetailsImp(user);
    }

}
