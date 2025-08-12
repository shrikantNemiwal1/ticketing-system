package com.codelogium.ticketing.service;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.codelogium.ticketing.dto.SupportAgentDTO;
import com.codelogium.ticketing.entity.User;
import com.codelogium.ticketing.entity.enums.UserRole;
import com.codelogium.ticketing.exception.ResourceNotFoundException;
import com.codelogium.ticketing.repository.UserRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class UserServiceImp implements UserService {

    private UserRepository userRepository;
    private BCryptPasswordEncoder bCryptPasswordEncoder;

    @Override
    public User createUser(User user) {
        // Encoding the password before saving
        user.setPassword(bCryptPasswordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    @Override
    public User retrieveUser(Long userId) {
        return unwrapUser(userId, userRepository.findById(userId));
    }

    // Retrieves a user based on email
    @Override
    public User retrieveUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User with email " + email + " not found"));
    }

    @Override
    public void removeUser(Long userId) {
        User retrievedUser = unwrapUser(userId, userRepository.findById(userId));

        userRepository.delete(retrievedUser);
    }

    public void validateUserExists(Long userId) {
        if (!userRepository.existsById(userId))
            throw new ResourceNotFoundException(userId, User.class);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    @Override
    public User saveUser(User user) {
        return userRepository.save(user);
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    @Override
    public List<User> getSupportAgents() {
        return userRepository.findByRoleIn(List.of(
                com.codelogium.ticketing.entity.enums.UserRole.SUPPORT_AGENT,
                com.codelogium.ticketing.entity.enums.UserRole.ADMIN));
    }

    @Override
    public List<SupportAgentDTO> getAssignableSupportAgents(Long currentUserId, UserRole currentUserRole) {
        List<User> supportAgents;

        switch (currentUserRole) {
            case ADMIN:
                // Admin gets all support agents (excluding admin and users)
                supportAgents = userRepository.findByRole(UserRole.SUPPORT_AGENT);
                break;
            case SUPPORT_AGENT:
                // Support agent gets other support agents (excluding themselves)
                supportAgents = userRepository.findByRole(UserRole.SUPPORT_AGENT);
                supportAgents = supportAgents.stream()
                        .filter(user -> !user.getId().equals(currentUserId))
                        .collect(java.util.stream.Collectors.toList());
                break;
            default:
                throw new IllegalArgumentException(
                        "Invalid user role for getting assignable support agents: " + currentUserRole);
        }

        // Convert to DTO with only id and email
        return supportAgents.stream()
                .map(user -> new SupportAgentDTO(user.getId(), user.getEmail()))
                .collect(java.util.stream.Collectors.toList());
    }

    public static User unwrapUser(Long userId, Optional<User> optionalUser) {
        return optionalUser.orElseThrow(() -> new ResourceNotFoundException(userId, User.class));
    }
}
