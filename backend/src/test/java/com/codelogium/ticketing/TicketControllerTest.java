package com.codelogium.ticketing;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import com.codelogium.ticketing.dto.TicketDTO;
import com.codelogium.ticketing.entity.Ticket;
import com.codelogium.ticketing.entity.User;
import com.codelogium.ticketing.entity.enums.Category;
import com.codelogium.ticketing.entity.enums.Priority;
import com.codelogium.ticketing.entity.enums.Status;
import com.codelogium.ticketing.entity.enums.UserRole;
import com.codelogium.ticketing.service.TicketService;
import com.codelogium.ticketing.service.UserService;
import com.codelogium.ticketing.web.TicketController;

@ExtendWith(MockitoExtension.class)
public class TicketControllerTest {

    @Mock
    private TicketService ticketService;

    @Mock
    private UserService userService;

    @Mock
    private Authentication authentication;

    @Mock
    private SecurityContext securityContext;

    @InjectMocks
    private TicketController ticketController;

    private User testUser;
    private User testAdmin;
    private User testSupportAgent;
    private Ticket testTicket;
    private TicketDTO testTicketDTO;

    @BeforeEach
    void setUp() {
        testUser = new User(1L, "tupac123", "tupac@gmail.com", UserRole.USER, true, new ArrayList<>(),
                new ArrayList<>());

        testAdmin = new User(2L, "admin123", "admin@example.com", UserRole.ADMIN, true, new ArrayList<>(),
                new ArrayList<>());

        testSupportAgent = new User(3L, "agent123", "agent@example.com", UserRole.SUPPORT_AGENT, true,
                new ArrayList<>(),
                new ArrayList<>());

        testTicket = new Ticket(1L, "Test Ticket", "Test Description",
                Instant.now(), Status.NEW, Category.NETWORK, Priority.HIGH, testUser, null, null, null,
                new ArrayList<>());

        testTicketDTO = new TicketDTO();
        testTicketDTO.setId(1L);
        testTicketDTO.setTitle("Test Ticket");
        testTicketDTO.setDescription("Test Description");
        testTicketDTO.setStatus(Status.NEW);
        testTicketDTO.setCategory(Category.NETWORK);
        testTicketDTO.setPriority(Priority.HIGH);

        // Mock security context
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
    }

    @Test
    void shouldGetUserTicketsPaginated() {
        // Mock
        when(authentication.getName()).thenReturn("tupac@gmail.com");
        when(userService.retrieveUser("tupac@gmail.com")).thenReturn(testUser);

        List<TicketDTO> ticketDTOs = List.of(testTicketDTO);
        Page<Ticket> ticketPage = new PageImpl<>(List.of(testTicket), PageRequest.of(0, 10), 1);

        when(ticketService.retrieveTicketsByCreatorPaginated(eq(testUser.getId()), any(Pageable.class)))
                .thenReturn(ticketPage);
        when(ticketService.convertToDTOList(any())).thenReturn(ticketDTOs);

        // Act
        ResponseEntity<Map<String, Object>> response = ticketController.getTickets(0, 10, "id", "desc");

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, ((List<?>) response.getBody().get("tickets")).size());
        assertEquals(0, response.getBody().get("currentPage"));
        assertEquals(1L, response.getBody().get("totalItems"));
    }

    @Test
    void shouldGetAllTicketsForAdmin() {
        // Mock
        when(authentication.getName()).thenReturn("admin@example.com");
        when(userService.retrieveUser("admin@example.com")).thenReturn(testAdmin);

        List<TicketDTO> ticketDTOs = List.of(testTicketDTO);
        Page<Ticket> ticketPage = new PageImpl<>(List.of(testTicket), PageRequest.of(0, 10), 1);

        when(ticketService.getAllTicketsPaginated(any(Pageable.class))).thenReturn(ticketPage);
        when(ticketService.convertToDTOList(any())).thenReturn(ticketDTOs);

        // Act
        ResponseEntity<Map<String, Object>> response = ticketController.getTickets(0, 10, "id", "desc");

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1L, response.getBody().get("totalItems"));
    }

    @Test
    void shouldPassCorrectSortParamsForUserTickets() {
        // Mock
        when(authentication.getName()).thenReturn("tupac@gmail.com");
        when(userService.retrieveUser("tupac@gmail.com")).thenReturn(testUser);

        Page<Ticket> ticketPage = new PageImpl<>(List.of(testTicket), PageRequest.of(0, 10), 1);
        when(ticketService.retrieveTicketsByCreatorPaginated(eq(testUser.getId()), any(Pageable.class)))
                .thenReturn(ticketPage);
        when(ticketService.convertToDTOList(any())).thenReturn(List.of(testTicketDTO));

        // Act
        ticketController.getTickets(2, 25, "creationDate", "asc");

        // Assert captured Pageable
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(ticketService).retrieveTicketsByCreatorPaginated(eq(testUser.getId()), pageableCaptor.capture());
        Pageable captured = pageableCaptor.getValue();

        assertEquals(2, captured.getPageNumber());
        assertEquals(25, captured.getPageSize());
        Sort.Order order = captured.getSort().getOrderFor("creationDate");
        assertNotNull(order);
        assertEquals(Sort.Direction.ASC, order.getDirection());
    }

    @Test
    void shouldPassCorrectSortParamsForAdminTickets() {
        // Mock
        when(authentication.getName()).thenReturn("admin@example.com");
        when(userService.retrieveUser("admin@example.com")).thenReturn(testAdmin);

        Page<Ticket> ticketPage = new PageImpl<>(List.of(testTicket), PageRequest.of(0, 10), 1);
        when(ticketService.getAllTicketsPaginated(any(Pageable.class))).thenReturn(ticketPage);
        when(ticketService.convertToDTOList(any())).thenReturn(List.of(testTicketDTO));

        // Act
        ticketController.getTickets(0, 10, "status", "desc");

        // Assert captured Pageable
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(ticketService).getAllTicketsPaginated(pageableCaptor.capture());
        Pageable captured = pageableCaptor.getValue();

        Sort.Order order = captured.getSort().getOrderFor("status");
        assertNotNull(order);
        assertEquals(Sort.Direction.DESC, order.getDirection());
    }

    @Test
    void shouldCreateTicketSuccessfully() {
        // Mock
        when(authentication.getName()).thenReturn("tupac@gmail.com");
        when(userService.retrieveUser("tupac@gmail.com")).thenReturn(testUser);
        when(ticketService.createTicket(anyLong(), any(Ticket.class))).thenReturn(testTicket);

        // Act
        ResponseEntity<String> response = ticketController.createTicket(testTicket);

        // Assert
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals("Ticket created successfully", response.getBody());
    }

    @Test
    void shouldRetrieveUserTicketById() {
        // Mock
        when(authentication.getName()).thenReturn("tupac@gmail.com");
        when(userService.retrieveUser("tupac@gmail.com")).thenReturn(testUser);
        when(ticketService.retrieveTicket(1L, testUser.getId())).thenReturn(testTicket);
        when(ticketService.convertToDTO(testTicket)).thenReturn(testTicketDTO);

        // Act
        ResponseEntity<TicketDTO> response = ticketController.retrieveTicket(1L);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testTicketDTO, response.getBody());
    }

    @Test
    void shouldRetrieveAnyTicketForAdmin() {
        // Mock
        when(authentication.getName()).thenReturn("admin@example.com");
        when(userService.retrieveUser("admin@example.com")).thenReturn(testAdmin);
        when(ticketService.retrieveTicketById(1L)).thenReturn(testTicket);
        when(ticketService.convertToDTO(testTicket)).thenReturn(testTicketDTO);

        // Act
        ResponseEntity<TicketDTO> response = ticketController.retrieveTicket(1L);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testTicketDTO, response.getBody());
    }

    @Test
    void shouldDeleteUserTicket() {
        // Mock
        when(authentication.getName()).thenReturn("tupac@gmail.com");
        when(userService.retrieveUser("tupac@gmail.com")).thenReturn(testUser);

        // Act
        ResponseEntity<Void> response = ticketController.removeTicket(1L);

        // Assert
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
    }

    @Test
    void shouldForbidSupportAgentFromDeletingTicket() {
        // Mock
        when(authentication.getName()).thenReturn("agent@example.com");
        when(userService.retrieveUser("agent@example.com")).thenReturn(testSupportAgent);

        // Act
        ResponseEntity<Void> response = ticketController.removeTicket(1L);

        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }
}
