package com.codelogium.ticketing.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.codelogium.ticketing.entity.User;
import com.codelogium.ticketing.entity.enums.UserRole;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    List<User> findByRoleIn(List<UserRole> roles);

    List<User> findByRole(UserRole role);
}
