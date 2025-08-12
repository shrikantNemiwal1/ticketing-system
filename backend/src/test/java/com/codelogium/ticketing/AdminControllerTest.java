package com.codelogium.ticketing;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.codelogium.ticketing.dto.SupportAgentDTO;
import com.codelogium.ticketing.entity.User;
import com.codelogium.ticketing.entity.enums.UserRole;
import com.codelogium.ticketing.service.UserService;
import com.codelogium.ticketing.web.AdminController;

@ExtendWith(MockitoExtension.class)
public class AdminControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private AdminController adminController;

    private User testUser;
    private User testAdmin;
    private User testSupportAgent;

    @BeforeEach
    void setUp() {
        testUser = new User(1L, "user123", "user@example.com", UserRole.USER, true, new ArrayList<>(),
                new ArrayList<>());

        testAdmin = new User(2L, "admin123", "admin@example.com", UserRole.ADMIN, true, new ArrayList<>(),
                new ArrayList<>());

        testSupportAgent = new User(3L, "agent123", "agent@example.com", UserRole.SUPPORT_AGENT, true,
                new ArrayList<>(),
                new ArrayList<>());
    }

    @Test
    void shouldDeleteUserSuccessfully() {
        // Mock
        when(userService.retrieveUser(1L)).thenReturn(testUser);

        // Act
        ResponseEntity<Map<String, String>> response = adminController.deleteUser(1L);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("User deleted successfully", response.getBody().get("message"));
        assertEquals("user@example.com", response.getBody().get("deletedEmail"));

        verify(userService).retrieveUser(1L);
        verify(userService).removeUser(1L);
    }

    @Test
    void shouldGetAllUsersPaginated() {
        // Mock
        List<User> users = List.of(testUser, testAdmin, testSupportAgent);
        Page<User> userPage = new PageImpl<>(users, PageRequest.of(0, 10), users.size());

        when(userService.getAllUsers(any(Pageable.class))).thenReturn(userPage);

        // Act
        ResponseEntity<Map<String, Object>> response = adminController.getAllUsers(0, 10, "id", "asc");

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(3, ((List<?>) response.getBody().get("users")).size());
        assertEquals(3L, response.getBody().get("totalItems"));
        assertEquals(1, response.getBody().get("totalPages"));
    }

    @Test
    void shouldGetUserDetails() {
        // Mock
        when(userService.retrieveUser(1L)).thenReturn(testUser);

        // Act
        ResponseEntity<User> response = adminController.getUserDetails(1L);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testUser, response.getBody());
        verify(userService).retrieveUser(1L);
    }

    @Test
    void shouldGetAllUsersNoPagination() {
        // Mock
        List<User> users = List.of(testUser, testAdmin, testSupportAgent);
        when(userService.getAllUsers()).thenReturn(users);

        // Act
        ResponseEntity<List<User>> response = adminController.getAllUsersNoPagination();

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(3, response.getBody().size());
        verify(userService).getAllUsers();
    }

    @Test
    void shouldGetSupportAgents() {
        // Mock
        List<User> supportAgents = List.of(testSupportAgent);
        when(userService.getSupportAgents()).thenReturn(supportAgents);

        // Act
        ResponseEntity<List<SupportAgentDTO>> response = adminController.getSupportAgents();

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        assertEquals(testSupportAgent.getId(), response.getBody().get(0).getId());
        assertEquals(testSupportAgent.getEmail(), response.getBody().get(0).getEmail());
        verify(userService).getSupportAgents();
    }
}
