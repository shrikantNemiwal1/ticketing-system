package com.codelogium.ticketing.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.codelogium.ticketing.dto.TicketAssignmentDTO;
import com.codelogium.ticketing.dto.TicketDTO;
import com.codelogium.ticketing.dto.TicketInfoUpdateDTO;
import com.codelogium.ticketing.dto.TicketStatusUpdateDTO;
import com.codelogium.ticketing.dto.UserBasicDTO;
import com.codelogium.ticketing.entity.AuditLog;
import com.codelogium.ticketing.entity.Ticket;
import com.codelogium.ticketing.entity.User;
import com.codelogium.ticketing.entity.enums.Status;
import com.codelogium.ticketing.entity.enums.Priority;
import com.codelogium.ticketing.entity.enums.UserRole;
import com.codelogium.ticketing.exception.ResourceNotFoundException;
import com.codelogium.ticketing.repository.AuditLogRepository;
import com.codelogium.ticketing.repository.TicketRepository;
import com.codelogium.ticketing.repository.UserRepository;

import jakarta.transaction.Transactional;

import static com.codelogium.ticketing.util.EntityUtils.*;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class TicketServiceImp implements TicketService {

    private TicketRepository ticketRepository;
    private UserRepository userRepository;
    private AuditLogRepository auditLogRepository;

    @Override
    public Ticket createTicket(Long userId, Ticket newTicket) {
        User user = UserServiceImp.unwrapUser(userId, userRepository.findById(userId));
        newTicket.setCreator(user);
        newTicket.setStatus(Status.NEW); // default status
        newTicket.setCreationDate(Instant.now());

        Ticket createdTicket = ticketRepository.save(newTicket);

        // Log ticket creation
        auditLogRepository.save(new AuditLog(
                null,
                createdTicket.getId(),
                null,
                userId,
                "TICKET_CREATED",
                null,
                createdTicket.getStatus().toString(),
                Instant.now()));

        auditLogRepository.flush(); // Ensure immediate persistence

        return createdTicket;
    }

    // Update Ticket by the creator
    @Transactional
    @Override
    public Ticket updateTicketInfo(Long ticketId, Long userId, TicketInfoUpdateDTO dto) {
        // Verify user existS
        validateUser(userId);

        // Get the ticket and verify it belongs to this user
        Ticket retrievedTicket = unwrapTicket(ticketId, ticketRepository.findByIdAndCreatorId(ticketId, userId));

        updateIfNotNull(retrievedTicket::setTitle, dto.getTitle());
        updateIfNotNull(retrievedTicket::setDescription, dto.getDescription());
        updateIfNotNull(retrievedTicket::setCategory, dto.getCategory());
        updateIfNotNull(retrievedTicket::setPriority, dto.getPriority());

        // Save ticket update
        return ticketRepository.save(retrievedTicket);
    }

    @Transactional
    @Override
    public Ticket updateTicketInfoByRole(Long ticketId, Long userId, TicketInfoUpdateDTO dto, UserRole userRole) {
        // Verify user exists
        validateUser(userId);

        Ticket retrievedTicket;
        switch (userRole) {
            case ADMIN:
            case SUPPORT_AGENT:
                // Admins and support agents can update any ticket
                retrievedTicket = unwrapTicket(ticketId, ticketRepository.findById(ticketId));
                break;
            case USER:
                // Users can only update their own tickets
                retrievedTicket = unwrapTicket(ticketId, ticketRepository.findByIdAndCreatorId(ticketId, userId));
                break;
            default:
                throw new IllegalArgumentException("Invalid user role: " + userRole);
        }

        updateIfNotNull(retrievedTicket::setTitle, dto.getTitle());
        updateIfNotNull(retrievedTicket::setDescription, dto.getDescription());
        updateIfNotNull(retrievedTicket::setCategory, dto.getCategory());
        updateIfNotNull(retrievedTicket::setPriority, dto.getPriority());

        // Save ticket update
        return ticketRepository.save(retrievedTicket);
    }

    @Transactional
    @Override
    public Ticket updateTicketStatus(Long ticketId, Long userId, TicketStatusUpdateDTO dto) {
        // validate user exists
        validateUser(userId);

        // Get the ticket and verify it belongs to this user
        Ticket retrievedTicket = unwrapTicket(ticketId, ticketRepository.findByIdAndCreatorId(ticketId, userId));

        // Store old status before making changes
        Status oldStatus = retrievedTicket.getStatus();

        updateIfNotNull(retrievedTicket::setStatus, dto.getStatus());

        Ticket savedTicket = ticketRepository.save(retrievedTicket);
        // Log status change if only there's an actual modification
        if (isStatusChanged(oldStatus, dto.getStatus())) {
            auditLogRepository.save(new AuditLog(
                    null,
                    ticketId,
                    null,
                    userId,
                    "STATUS_UPDATED",
                    oldStatus.toString(),
                    dto.getStatus().toString(),
                    Instant.now()));

            auditLogRepository.flush(); // Ensure immediate persistence

        }
        return savedTicket;
    }

    @Transactional
    @Override
    public Ticket updateTicketStatusByRole(Long ticketId, Long userId, TicketStatusUpdateDTO dto, UserRole userRole) {
        // validate user exists
        validateUser(userId);

        Ticket retrievedTicket;
        switch (userRole) {
            case ADMIN:
            case SUPPORT_AGENT:
                // Admins and support agents can update status for any ticket
                retrievedTicket = unwrapTicket(ticketId, ticketRepository.findById(ticketId));
                break;
            case USER:
                // Users can update status only for their own tickets
                retrievedTicket = unwrapTicket(ticketId, ticketRepository.findByIdAndCreatorId(ticketId, userId));
                break;
            default:
                throw new IllegalArgumentException("Invalid user role: " + userRole);
        }

        // Store old status before making changes
        Status oldStatus = retrievedTicket.getStatus();

        updateIfNotNull(retrievedTicket::setStatus, dto.getStatus());

        Ticket savedTicket = ticketRepository.save(retrievedTicket);
        // Log status change if only there's an actual modification
        if (isStatusChanged(oldStatus, dto.getStatus())) {
            auditLogRepository.save(new AuditLog(
                    null,
                    ticketId,
                    null,
                    userId,
                    "STATUS_UPDATED",
                    oldStatus.toString(),
                    dto.getStatus().toString(),
                    Instant.now()));

            auditLogRepository.flush(); // Ensure immediate persistence
        }
        return savedTicket;
    }

    @Override
    public Ticket retrieveTicket(Long ticketId, Long userId) {

        // validate user exists
        validateUser(userId);

        // ensure relationship user->ticket and retrieved ticket
        return unwrapTicket(ticketId, ticketRepository.findByIdAndCreatorId(ticketId, userId));
    }

    @Override
    public Ticket retrieveTicketById(Long ticketId) {
        return unwrapTicket(ticketId, ticketRepository.findById(ticketId));
    }

    @Override
    public List<Ticket> retrieveTicketsByCreator(Long userId) {
        validateUser(userId);

        List<Ticket> tickets = ticketRepository.findByCreatorIdWithCreator(userId);
        // Return empty list if no tickets found - this is NOT an error condition
        return tickets != null ? tickets : new ArrayList<>();
    }

    // legacy search removed; use filtered list endpoints

    @Override
    public List<AuditLog> retrieveAuditLogs(Long ticketId, Long userId) {
        // Verify user existence by checking the creator relationship
        UserServiceImp.unwrapUser(userId, ticketRepository.findCreatorByTicket(ticketId));

        return auditLogRepository.findByTicketId(ticketId);
    }

    @Override
    public void removeTicket(Long ticketId, Long userId) {
        // validate user exists
        validateUser(userId);

        // Get the ticket
        Ticket ticket = unwrapTicket(ticketId, ticketRepository.findByIdAndCreatorId(ticketId, userId));

        User user = ticket.getCreator();

        user.getTickets().remove(ticket); // remove ticket from the user's list before updating

        userRepository.save(user); // Save user to updated reference, this will trigger orphanRemoval thus no need
                                   // to manually delete the ticket from tickerRepository
    }

    // We're just validating, not actually querying and extracting the db
    /*
     * Possible to dedicate an entity validation service, that would centralize
     * validation but nothing complex here, thus the duplication method in ticket
     * service and comment service
     */
    private void validateUser(Long userId) {
        if (!userRepository.existsById(userId))
            throw new ResourceNotFoundException(userId, User.class);
    }

    private boolean isStatusChanged(Status oldStatus, Status newStatus) {
        return newStatus != null && !oldStatus.equals(newStatus);
    }

    // Assignment methods implementation
    @Override
    @Transactional
    public Ticket assignTicket(Long ticketId, TicketAssignmentDTO assignmentDTO, Long assignedById) {
        // Find the ticket
        Ticket ticket = unwrapTicket(ticketId, ticketRepository.findById(ticketId));

        // Find the user to assign to
        User assignedToUser = userRepository.findById(assignmentDTO.getAssignedToId())
                .orElseThrow(() -> new ResourceNotFoundException(assignmentDTO.getAssignedToId(), User.class));

        // Find the user who is assigning
        User assignedByUser = userRepository.findById(assignedById)
                .orElseThrow(() -> new ResourceNotFoundException(assignedById, User.class));

        // Update assignment fields
        ticket.setAssignedTo(assignedToUser);
        ticket.setAssignedAt(Instant.now());
        ticket.setAssignedBy(assignedByUser);

        // Save ticket
        return ticketRepository.save(ticket);
    }

    @Override
    public List<Ticket> getAllTickets() {
        return ticketRepository.findAllWithCreator();
    }

    @Override
    public List<Ticket> getTicketsByAssignee(Long assigneeId) {
        return ticketRepository.findByAssignedToIdWithCreator(assigneeId);
    }

    @Override
    public List<Ticket> getUnassignedTickets() {
        return ticketRepository.findByAssignedToIsNull();
    }

    @Override
    public TicketDTO convertToDTO(Ticket ticket) {
        TicketDTO dto = new TicketDTO();
        dto.setId(ticket.getId());
        dto.setTitle(ticket.getTitle());
        dto.setDescription(ticket.getDescription());
        dto.setCreationDate(ticket.getCreationDate().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime());
        dto.setStatus(ticket.getStatus());
        dto.setCategory(ticket.getCategory());
        dto.setPriority(ticket.getPriority());
        dto.setAssignedAt(ticket.getAssignedAt() != null
                ? ticket.getAssignedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime()
                : null);

        // Convert User entities to UserBasicDTO to avoid circular references
        if (ticket.getAssignedTo() != null) {
            dto.setAssignedTo(convertUserToBasicDTO(ticket.getAssignedTo()));
        }
        if (ticket.getAssignedBy() != null) {
            dto.setAssignedBy(convertUserToBasicDTO(ticket.getAssignedBy()));
        }
        if (ticket.getCreator() != null) {
            dto.setCreatedBy(convertUserToBasicDTO(ticket.getCreator()));
        }

        return dto;
    }

    @Override
    public List<TicketDTO> convertToDTOList(List<Ticket> tickets) {
        return tickets.stream()
                .map(this::convertToDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    private UserBasicDTO convertUserToBasicDTO(User user) {
        UserBasicDTO dto = new UserBasicDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        return dto;
    }

    public static Ticket unwrapTicket(Long ticketId, Optional<Ticket> optionalTicket) {
        return optionalTicket.orElseThrow(() -> new ResourceNotFoundException(ticketId, Ticket.class));
    }

    // Paginated methods implementation
    @Override
    public Page<Ticket> getAllTicketsPaginated(Pageable pageable) {
        return ticketRepository.findAll(pageable);
    }

    @Override
    public Page<Ticket> retrieveTicketsByCreatorPaginated(Long userId, Pageable pageable) {
        return ticketRepository.findByCreatorId(userId, pageable);
    }

    @Override
    public Page<Ticket> getTicketsByAssigneePaginated(Long assigneeId, Pageable pageable) {
        return ticketRepository.findByAssignedToId(assigneeId, pageable);
    }

    // Filtered pagination implementations
    @Override
    public Page<Ticket> getAllTicketsPaginatedFiltered(String search, Status status, Priority priority,
            Pageable pageable) {
        String normalizedSearch = (search == null || search.isBlank()) ? null : search;
        return ticketRepository.findAllFiltered(normalizedSearch, status, priority, pageable);
    }

    @Override
    public Page<Ticket> retrieveTicketsByCreatorPaginatedFiltered(Long userId, String search, Status status,
            Priority priority, Pageable pageable) {
        validateUser(userId);
        String normalizedSearch = (search == null || search.isBlank()) ? null : search;
        return ticketRepository.findByCreatorIdFiltered(userId, normalizedSearch, status, priority, pageable);
    }

    @Override
    public Page<Ticket> getTicketsByAssigneePaginatedFiltered(Long assigneeId, String search, Status status,
            Priority priority, Pageable pageable) {
        String normalizedSearch = (search == null || search.isBlank()) ? null : search;
        return ticketRepository.findByAssignedToIdFiltered(assigneeId, normalizedSearch, status, priority, pageable);
    }
}
