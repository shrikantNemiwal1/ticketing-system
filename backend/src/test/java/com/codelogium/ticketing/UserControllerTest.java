package com.codelogium.ticketing;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.codelogium.ticketing.entity.User;
import com.codelogium.ticketing.entity.enums.UserRole;
import com.codelogium.ticketing.service.UserService;
import com.codelogium.ticketing.web.UserController;

@ExtendWith(MockitoExtension.class)
public class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User(1L, "password123", "test@example.com", UserRole.USER, false, new ArrayList<>(),
                new ArrayList<>());
    }

    @Test
    void shouldRegisterUserSuccessfully() {
        // Mock
        when(userService.createUser(any(User.class))).thenReturn(testUser);

        // Act
        ResponseEntity<String> response = userController.registerUser(testUser);

        // Assert
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("User registered successfully", response.getBody());
    }

    @Test
    void shouldRetrieveUserSuccessfully() {
        // Mock
        when(userService.retrieveUser(1L)).thenReturn(testUser);

        // Act
        ResponseEntity<User> response = userController.retrieveUser(1L);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testUser, response.getBody());
    }

    @Test
    void shouldDeleteUserSuccessfully() {
        // Act
        ResponseEntity<Void> response = userController.removeUser(1L);

        // Assert
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(userService).removeUser(1L);
    }
}
