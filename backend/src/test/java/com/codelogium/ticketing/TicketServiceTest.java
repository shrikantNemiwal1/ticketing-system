package com.codelogium.ticketing;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import com.codelogium.ticketing.dto.TicketAssignmentDTO;
import com.codelogium.ticketing.dto.TicketInfoUpdateDTO;
import com.codelogium.ticketing.dto.TicketStatusUpdateDTO;
import com.codelogium.ticketing.entity.AuditLog;
import com.codelogium.ticketing.entity.Ticket;
import com.codelogium.ticketing.entity.User;
import com.codelogium.ticketing.entity.enums.Category;
import com.codelogium.ticketing.entity.enums.Priority;
import com.codelogium.ticketing.entity.enums.Status;
import com.codelogium.ticketing.entity.enums.UserRole;
import com.codelogium.ticketing.exception.ResourceNotFoundException;
import com.codelogium.ticketing.repository.AuditLogRepository;
import com.codelogium.ticketing.repository.TicketRepository;
import com.codelogium.ticketing.repository.UserRepository;
import com.codelogium.ticketing.service.TicketService;
import com.codelogium.ticketing.service.TicketServiceImp;

@ExtendWith(SpringExtension.class)
public class TicketServiceTest {

    private TicketService ticketService;

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private UserRepository userRepository;

    private User testUser;
    private User testAdmin;
    private User testSupportAgent;
    private Ticket testTicket;
    private Ticket testAssignedTicket;
    private AuditLog testAuditLog;

    @BeforeEach
    void setUp() throws Exception {
        ticketService = new TicketServiceImp(ticketRepository, userRepository, auditLogRepository);

        testUser = new User(1L, "tupac123", "tupac@gmail.com", UserRole.USER, false, new ArrayList<>(),
                new ArrayList<>());

        testAdmin = new User(2L, "admin123", "admin@example.com", UserRole.ADMIN, true, new ArrayList<>(),
                new ArrayList<>());

        testSupportAgent = new User(3L, "agent123", "agent@example.com", UserRole.SUPPORT_AGENT, true,
                new ArrayList<>(),
                new ArrayList<>());

        testTicket = new Ticket(1L, "Discrepancy while login", "Error 500 keeps pop up while password is correct",
                Instant.now(), Status.NEW, Category.NETWORK, Priority.HIGH, testUser, null, null, null,
                new ArrayList<>());

        testAssignedTicket = new Ticket(2L, "Software installation issue", "Cannot install required software",
                Instant.now(), Status.IN_PROGRESS, Category.SOFTWARE, Priority.MEDIUM, testUser, testSupportAgent, null,
                null,
                new ArrayList<>());

        testAuditLog = new AuditLog(1L, testTicket.getId(), null, testUser.getId(), "TICKET_CREATED", null,
                testTicket.getStatus().toString(), Instant.now());
    }

    private void mockBasicUserAndTicketRepo() {
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(userRepository.existsById(testUser.getId())).thenReturn(true);
        when(ticketRepository.findByIdAndCreatorId(testTicket.getId(), testUser.getId()))
                .thenReturn(Optional.of(testTicket));
    }

    @Test
    void shouldAddTicketSuccessfully() {
        // Mock
        // Status is null in order to test if it being set while ticket saving
        Ticket ticketToCreate = new Ticket(testTicket.getId(), "Discrepancy while login",
                "Error 500 keeps pop up while password is correct", Instant.now(), null, Category.NETWORK,
                Priority.HIGH, testUser, null, null, null, new ArrayList<>());

        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(ticketRepository.save(ticketToCreate)).thenReturn(ticketToCreate);

        // Act
        Ticket result = ticketService.createTicket(1L, ticketToCreate);

        // Assert
        assertNotNull(result);
        assertEquals("Discrepancy while login", result.getTitle());
        assertEquals(Status.NEW, result.getStatus()); // Assure that status was set during ticket creation
        verify(ticketRepository, times(1)).save(any(Ticket.class));
    }

    @Test
    void shouldRetrieveTicketSuccessfully() {
        // Mock
        mockBasicUserAndTicketRepo();

        // Act
        Ticket result = ticketService.retrieveTicket(1L, 1L);

        // Assert
        assertEquals(testTicket.getId(), result.getId());
        assertEquals(testTicket.getTitle(), result.getTitle());
    }

    @Test
    void shouldUpdateTicketInfoSuccessfully() {
        // Mock
        mockBasicUserAndTicketRepo();

        TicketInfoUpdateDTO dto = new TicketInfoUpdateDTO("Can't Login even if password is correct", null, null,
                Category.OTHER, Priority.MEDIUM);

        Ticket retrievedTicket = ticketRepository.findByIdAndCreatorId(testTicket.getId(), testUser.getId()).get();
        when(ticketRepository.save(retrievedTicket)).thenReturn(retrievedTicket);

        // Act
        Ticket result = ticketService.updateTicketInfo(testTicket.getId(), testUser.getId(), dto);

        // assert
        assertEquals(dto.getTitle(), result.getTitle());
        assertEquals(testTicket.getDescription(), result.getDescription()); // assert with ticket because description
                                                                            // was not changed
        assertEquals(dto.getCategory(), result.getCategory());
        assertEquals(dto.getPriority(), result.getPriority());
    }

    @Test
    void shouldUpdateTicketStatusSuccessfully() {
        // Mock
        mockBasicUserAndTicketRepo();

        TicketStatusUpdateDTO dto = new TicketStatusUpdateDTO(Status.IN_PROGRESS);

        Ticket retrievedTicket = ticketRepository.findByIdAndCreatorId(testTicket.getId(), testUser.getId()).get();

        when(ticketRepository.save(retrievedTicket)).thenReturn(retrievedTicket);

        // Act
        Ticket result = ticketService.updateTicketStatus(testTicket.getId(), testUser.getId(), dto);

        // assert
        assertEquals(dto.getStatus(), result.getStatus());
        assertEquals(retrievedTicket.getTitle(), result.getTitle());
    }

    @Test
    void shouldRemoveTicketSuccessfully() {
        // Mock
        mockBasicUserAndTicketRepo();
        // assure that user have its ticket list, as orphan removal will delete the
        // ticket once it removed from user ticket list
        testUser.setTickets(new ArrayList<>(List.of(testTicket)));
        when(ticketRepository.save(testTicket)).thenReturn(testTicket);

        // Act
        ticketService.removeTicket(testTicket.getId(), testUser.getId());

        // Assert
        assertFalse(testUser.getTickets().contains(testTicket));
        verify(userRepository, times(1)).save(testUser);
        verify(ticketRepository, never()).delete(any());
    }

    @Test
    void shouldRetrieveAuditLogSuccessfully() {
        // Mock
        when(ticketRepository.findCreatorByTicket(testTicket.getId())).thenReturn(Optional.of(testUser));
        when(auditLogRepository.findByTicketId(testTicket.getId())).thenReturn(List.of(testAuditLog));

        // Act
        List<AuditLog> results = ticketService.retrieveAuditLogs(testTicket.getId(), testUser.getId());

        // Assert
        assertEquals(1, results.size(), 1);

        AuditLog result = results.get(0);
        assertEquals(testAuditLog.getAction(), result.getAction());
        assertEquals(testAuditLog.getTicketId(), result.getTicketId());
        assertEquals(testAuditLog.getUserId(), result.getUserId());
    }

    @Test
    void shouldRetrieveTicketsByCreatorSuccessfully() {
        // Mock
        when(userRepository.existsById(testUser.getId())).thenReturn(true);
        when(ticketRepository.findByCreatorIdWithCreator(testUser.getId())).thenReturn(List.of(testTicket));

        // Act
        List<Ticket> results = ticketService.retrieveTicketsByCreator(testUser.getId());

        // Assert
        assertEquals(1, results.size());

        Ticket result = results.get(0);
        assertEquals(testTicket.getStatus(), result.getStatus());
        assertEquals(testTicket.getCreator(), result.getCreator());
        assertEquals(testTicket.getId(), result.getId());
    }

    /* NON SUCCESSFUL CALLS */

    @Test
    void shouldReturnEmptyListWhenNoTicketsFoundByCreator() {
        // Mock
        when(userRepository.existsById(testUser.getId())).thenReturn(true);
        when(ticketRepository.findByCreatorIdWithCreator(testUser.getId())).thenReturn(new ArrayList<>());

        // Act
        List<Ticket> results = ticketService.retrieveTicketsByCreator(testUser.getId());

        // Assert
        assertEquals(0, results.size());
        assertTrue(results.isEmpty());
    }

    // ============ PAGINATION TESTS ============

    @Test
    void shouldRetrieveAllTicketsPaginated() {
        // Mock
        Pageable pageable = PageRequest.of(0, 10);
        List<Ticket> tickets = List.of(testTicket, testAssignedTicket);
        Page<Ticket> ticketPage = new PageImpl<>(tickets, pageable, tickets.size());

        when(ticketRepository.findAll(pageable)).thenReturn(ticketPage);

        // Act
        Page<Ticket> result = ticketService.getAllTicketsPaginated(pageable);

        // Assert
        assertEquals(2, result.getContent().size());
        assertEquals(2, result.getTotalElements());
        verify(ticketRepository, times(1)).findAll(pageable);
    }

    @Test
    void shouldRetrieveTicketsByCreatorPaginated() {
        // Mock
        Pageable pageable = PageRequest.of(0, 10);
        List<Ticket> tickets = List.of(testTicket);
        Page<Ticket> ticketPage = new PageImpl<>(tickets, pageable, tickets.size());

        when(userRepository.existsById(testUser.getId())).thenReturn(true);
        when(ticketRepository.findByCreatorId(testUser.getId(), pageable)).thenReturn(ticketPage);

        // Act
        Page<Ticket> result = ticketService.retrieveTicketsByCreatorPaginated(testUser.getId(), pageable);

        // Assert
        assertEquals(1, result.getContent().size());
        assertEquals(testTicket.getId(), result.getContent().get(0).getId());
        verify(ticketRepository, times(1)).findByCreatorId(testUser.getId(), pageable);
    }

    @Test
    void shouldRetrieveTicketsByAssigneePaginated() {
        // Mock
        Pageable pageable = PageRequest.of(0, 10);
        List<Ticket> tickets = List.of(testAssignedTicket);
        Page<Ticket> ticketPage = new PageImpl<>(tickets, pageable, tickets.size());

        when(userRepository.existsById(testSupportAgent.getId())).thenReturn(true);
        when(ticketRepository.findByAssignedToId(testSupportAgent.getId(), pageable)).thenReturn(ticketPage);

        // Act
        Page<Ticket> result = ticketService.getTicketsByAssigneePaginated(testSupportAgent.getId(), pageable);

        // Assert
        assertEquals(1, result.getContent().size());
        assertEquals(testAssignedTicket.getId(), result.getContent().get(0).getId());
        verify(ticketRepository, times(1)).findByAssignedToId(testSupportAgent.getId(), pageable);
    }

    // ============ TICKET ASSIGNMENT TESTS ============

    @Test
    void shouldAssignTicketSuccessfully() {
        // Mock
        TicketAssignmentDTO assignmentDTO = new TicketAssignmentDTO();
        assignmentDTO.setAssignedToId(testSupportAgent.getId());

        when(ticketRepository.findById(testTicket.getId())).thenReturn(Optional.of(testTicket));
        when(userRepository.findById(testSupportAgent.getId())).thenReturn(Optional.of(testSupportAgent));
        when(userRepository.findById(testAdmin.getId())).thenReturn(Optional.of(testAdmin));
        when(userRepository.existsById(testAdmin.getId())).thenReturn(true);
        when(ticketRepository.save(any(Ticket.class))).thenReturn(testAssignedTicket);

        // Act
        Ticket result = ticketService.assignTicket(testTicket.getId(), assignmentDTO, testAdmin.getId());

        // Assert
        assertNotNull(result);
        verify(ticketRepository, times(1)).save(any(Ticket.class));
        // Note: assignTicket may or may not create audit log based on implementation
    }

    // ============ EXCEPTION HANDLING TESTS ============

    @Test
    void shouldThrowExceptionWhenTicketNotFound() {
        // Mock
        when(ticketRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> ticketService.retrieveTicketById(999L));

        assertTrue(exception.getMessage().contains("The ticket with the id 999 is not found"));
    }

    @Test
    void shouldThrowExceptionWhenUserNotFound() {
        // Mock
        when(userRepository.existsById(999L)).thenReturn(false);

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> ticketService.retrieveTicketsByCreator(999L));

        assertTrue(exception.getMessage().contains("The user with the id 999 is not found"));
    }

    // ============ TICKET STATUS UPDATE TESTS ============

    @Test
    void shouldUpdateTicketStatusByRoleSuccessfully() {
        // Mock
        TicketStatusUpdateDTO statusUpdateDTO = new TicketStatusUpdateDTO(Status.RESOLVED);

        when(ticketRepository.findById(testTicket.getId())).thenReturn(Optional.of(testTicket));
        when(userRepository.findById(testSupportAgent.getId())).thenReturn(Optional.of(testSupportAgent));
        when(userRepository.existsById(testSupportAgent.getId())).thenReturn(true);

        Ticket updatedTicket = new Ticket(testTicket.getId(), testTicket.getTitle(), testTicket.getDescription(),
                testTicket.getCreationDate(), Status.RESOLVED, testTicket.getCategory(), testTicket.getPriority(),
                testTicket.getCreator(), null, null, null, testTicket.getComments());

        when(ticketRepository.save(any(Ticket.class))).thenReturn(updatedTicket);

        // Act
        Ticket result = ticketService.updateTicketStatusByRole(testTicket.getId(), testSupportAgent.getId(),
                statusUpdateDTO, UserRole.SUPPORT_AGENT);

        // Assert
        assertNotNull(result);
        verify(ticketRepository, times(1)).save(any(Ticket.class));
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    // Search-by-id-and-status tests removed: feature migrated to filters on GET
    // /tickets
}
