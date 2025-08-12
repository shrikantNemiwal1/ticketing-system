package com.codelogium.ticketing.web;

import com.codelogium.ticketing.dto.TicketAssignmentDTO;
import com.codelogium.ticketing.dto.TicketDTO;
import com.codelogium.ticketing.entity.Ticket;
import com.codelogium.ticketing.entity.User;
import com.codelogium.ticketing.entity.enums.UserRole;
import com.codelogium.ticketing.service.TicketService;
import com.codelogium.ticketing.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tickets-unified")
@RequiredArgsConstructor
@Tag(name = "Ticket Management", description = "Unified ticket management for all user roles")
@SecurityRequirement(name = "Bearer Authentication")
@Hidden // Avoid confusion in Swagger; use paginated endpoints in TicketController
        // instead
public class UnifiedTicketController {

    private final TicketService ticketService;
    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('USER', 'SUPPORT_AGENT', 'ADMIN')")
    @Operation(summary = "Get tickets", description = "Role-based ticket retrieval: User sees own tickets, Admin sees all tickets, Agent sees assigned tickets")
    public ResponseEntity<List<TicketDTO>> getTickets() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User currentUser = userService.retrieveUser(email);

        List<Ticket> tickets;

        switch (currentUser.getRole()) {
            case USER:
                // Users see only their own tickets
                tickets = ticketService.retrieveTicketsByCreator(currentUser.getId());
                break;
            case ADMIN:
                // Admins see all tickets
                tickets = ticketService.getAllTickets();
                break;
            case SUPPORT_AGENT:
                // Support agents see only tickets assigned to them
                tickets = ticketService.getTicketsByAssignee(currentUser.getId());
                break;
            default:
                tickets = List.of(); // Empty list for unknown roles
        }

        return ResponseEntity.ok(ticketService.convertToDTOList(tickets));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USER')")
    @Operation(summary = "Create ticket", description = "Create a new support ticket (Users only)")
    public ResponseEntity<TicketDTO> createTicket(@Valid @RequestBody Ticket newTicket) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User currentUser = userService.retrieveUser(email);

        Ticket createdTicket = ticketService.createTicket(currentUser.getId(), newTicket);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.convertToDTO(createdTicket));
    }

    @PatchMapping("/{ticketId}/assign")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SUPPORT_AGENT')")
    @Operation(summary = "Assign/Reassign ticket", description = "Admin can assign any ticket, Support Agent can reassign only their assigned tickets")
    public ResponseEntity<TicketDTO> assignTicket(
            @PathVariable Long ticketId,
            @Valid @RequestBody TicketAssignmentDTO assignmentDTO) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User currentUser = userService.retrieveUser(email);

        // Additional validation for support agents
        if (currentUser.getRole() == UserRole.SUPPORT_AGENT) {
            // Support agents can only reassign tickets that are currently assigned to them
            Ticket existingTicket = ticketService.retrieveTicketById(ticketId);
            if (existingTicket.getAssignedTo() == null ||
                    !existingTicket.getAssignedTo().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        Ticket assignedTicket = ticketService.assignTicket(ticketId, assignmentDTO, currentUser.getId());
        return ResponseEntity.ok(ticketService.convertToDTO(assignedTicket));
    }
}
