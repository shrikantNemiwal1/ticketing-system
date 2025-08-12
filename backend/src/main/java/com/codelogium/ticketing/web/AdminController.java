package com.codelogium.ticketing.web;

import com.codelogium.ticketing.dto.SupportAgentCreationDTO;
import com.codelogium.ticketing.dto.SupportAgentDTO;
import com.codelogium.ticketing.entity.User;
import com.codelogium.ticketing.entity.enums.UserRole;
import com.codelogium.ticketing.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Management", description = "Admin-only endpoints for user and system management")
@SecurityRequirement(name = "Bearer Authentication")
public class AdminController {

    private final UserService userService;
    private final BCryptPasswordEncoder passwordEncoder;

    @PostMapping("/create-support-agent")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Create support agent", description = "Admin can create support agent accounts (no email verification required)")
    public ResponseEntity<Map<String, Object>> createSupportAgent(
            @Valid @RequestBody SupportAgentCreationDTO agentDTO) {

        // Check if user already exists
        if (userService.existsByEmail(agentDTO.getEmail())) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "User with this email already exists");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }

        if (agentDTO.getRole() != UserRole.SUPPORT_AGENT && agentDTO.getRole() != UserRole.ADMIN) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Invalid role. Only SUPPORT_AGENT or ADMIN roles are allowed");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        User user = new User();
        user.setEmail(agentDTO.getEmail());
        user.setPassword(passwordEncoder.encode(agentDTO.getPassword()));
        user.setRole(agentDTO.getRole());
        user.setEmailVerified(true);

        User savedUser = userService.saveUser(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", agentDTO.getRole().name() + " created successfully");
        response.put("userId", savedUser.getId());
        response.put("email", savedUser.getEmail());
        response.put("role", savedUser.getRole());
        response.put("emailVerified", savedUser.isEmailVerified());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/users/{userId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Delete user", description = "Admin can delete any user account")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long userId) {

        User user = userService.retrieveUser(userId);

        userService.removeUser(userId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "User deleted successfully");
        response.put("deletedEmail", user.getEmail());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Get user details", description = "Admin can view any user's details")
    public ResponseEntity<User> getUserDetails(@PathVariable Long userId) {
        User user = userService.retrieveUser(userId);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Get all users", description = "Admin can view all users with optional pagination")
    public ResponseEntity<Map<String, Object>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<User> userPage = userService.getAllUsers(pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("users", userPage.getContent());
        response.put("currentPage", userPage.getNumber());
        response.put("totalItems", userPage.getTotalElements());
        response.put("totalPages", userPage.getTotalPages());
        response.put("size", userPage.getSize());
        response.put("hasNext", userPage.hasNext());
        response.put("hasPrevious", userPage.hasPrevious());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/all")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Get all users (no pagination)", description = "Admin can view all users without pagination")
    public ResponseEntity<List<User>> getAllUsersNoPagination() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/support-agents")
    @PreAuthorize("hasAnyAuthority('SUPPORT_AGENT', 'ADMIN')")
    @Operation(summary = "Get support agents", description = "Get list of support agents for assignment. Returns different data based on user role.")
    public ResponseEntity<List<SupportAgentDTO>> getSupportAgents() {
        List<User> supportAgents = userService.getSupportAgents();

        List<SupportAgentDTO> agentDTOs = supportAgents.stream()
                .map(agent -> new SupportAgentDTO(agent.getId(), agent.getEmail()))
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(agentDTOs);
    }
}
