package com.codelogium.ticketing;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import com.codelogium.ticketing.dto.CommentDTO;
import com.codelogium.ticketing.entity.Comment;
import com.codelogium.ticketing.entity.Ticket;
import com.codelogium.ticketing.entity.User;
import com.codelogium.ticketing.entity.enums.Category;
import com.codelogium.ticketing.entity.enums.Priority;
import com.codelogium.ticketing.entity.enums.Status;
import com.codelogium.ticketing.entity.enums.UserRole;
import com.codelogium.ticketing.service.CommentService;
import com.codelogium.ticketing.service.UserService;
import com.codelogium.ticketing.web.CommentController;

@ExtendWith(MockitoExtension.class)
public class CommentControllerTest {

    @Mock
    private CommentService commentService;

    @Mock
    private UserService userService;

    @Mock
    private Authentication authentication;

    @Mock
    private SecurityContext securityContext;

    @InjectMocks
    private CommentController commentController;

    private User testUser;
    private User testAdmin;
    private Ticket testTicket;
    private Comment testComment;
    private CommentDTO testCommentDTO;

    @BeforeEach
    void setUp() {
        testUser = new User(1L, "tupac123", "tupac@gmail.com", UserRole.USER, true, new ArrayList<>(),
                new ArrayList<>());

        testAdmin = new User(2L, "admin123", "admin@example.com", UserRole.ADMIN, true, new ArrayList<>(),
                new ArrayList<>());

        testTicket = new Ticket(1L, "Test Ticket", "Test Description",
                Instant.now(), Status.NEW, Category.NETWORK, Priority.HIGH, testUser, null, null, null,
                new ArrayList<>());

        testComment = new Comment();
        testComment.setId(1L);
        testComment.setContent("Test comment content");
        testComment.setCreatedAt(Instant.now());
        testComment.setAuthor(testUser);
        testComment.setTicket(testTicket);

        testCommentDTO = new CommentDTO();
        testCommentDTO.setId(1L);
        testCommentDTO.setContent("Test comment content");

        // Mock security context
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
    }

    @Test
    void shouldCreateCommentSuccessfully() {
        // Mock
        when(authentication.getName()).thenReturn("tupac@gmail.com");
        when(userService.retrieveUser("tupac@gmail.com")).thenReturn(testUser);
        when(commentService.createComment(anyLong(), anyLong(), any(Comment.class))).thenReturn(testComment);

        // Act
        ResponseEntity<Comment> response = commentController.createComment(1L, testComment);

        // Assert
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(testComment, response.getBody());
    }

    @Test
    void shouldRetrieveCommentsForUser() {
        // Mock
        when(authentication.getName()).thenReturn("tupac@gmail.com");
        when(userService.retrieveUser("tupac@gmail.com")).thenReturn(testUser);
        when(commentService.getAllCommentsForTicket(1L, testUser.getId())).thenReturn(List.of(testComment));
        when(commentService.convertToDTOList(any())).thenReturn(List.of(testCommentDTO));

        // Act
        ResponseEntity<List<CommentDTO>> response = commentController.getAllComments(1L);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        assertEquals(testCommentDTO, response.getBody().get(0));
    }

    @Test
    void shouldRetrieveCommentsForAdmin() {
        // Mock
        when(authentication.getName()).thenReturn("admin@example.com");
        when(userService.retrieveUser("admin@example.com")).thenReturn(testAdmin);
        when(commentService.getAllCommentsForTicketByRole(eq(1L), eq(testAdmin.getId()), eq(UserRole.ADMIN)))
                .thenReturn(List.of(testComment));
        when(commentService.convertToDTOList(any())).thenReturn(List.of(testCommentDTO));

        // Act
        ResponseEntity<List<CommentDTO>> response = commentController.getAllComments(1L);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        assertEquals(testCommentDTO, response.getBody().get(0));
    }
}
