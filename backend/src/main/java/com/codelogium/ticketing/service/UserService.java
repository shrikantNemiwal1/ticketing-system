package com.codelogium.ticketing.service;

import com.codelogium.ticketing.dto.SupportAgentDTO;
import com.codelogium.ticketing.entity.User;
import com.codelogium.ticketing.entity.enums.UserRole;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserService {
    User createUser(User user);

    User retrieveUser(Long userId);

    User retrieveUser(String email);

    void removeUser(Long userId);

    boolean existsByEmail(String email);

    User saveUser(User user);

    List<User> getAllUsers();

    Page<User> getAllUsers(Pageable pageable);

    List<User> getSupportAgents();

    List<SupportAgentDTO> getAssignableSupportAgents(Long currentUserId, UserRole currentUserRole);
}
