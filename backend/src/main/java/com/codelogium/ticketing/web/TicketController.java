package com.codelogium.ticketing.web;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.codelogium.ticketing.dto.TicketAssignmentDTO;
import com.codelogium.ticketing.dto.TicketDTO;
import com.codelogium.ticketing.dto.TicketInfoUpdateDTO;
import com.codelogium.ticketing.dto.TicketStatusUpdateDTO;
import com.codelogium.ticketing.dto.SupportAgentDTO;
import com.codelogium.ticketing.entity.AuditLog;
import com.codelogium.ticketing.entity.Ticket;
import com.codelogium.ticketing.entity.User;
import com.codelogium.ticketing.entity.enums.Status;
import com.codelogium.ticketing.exception.ErrorResponse;
import com.codelogium.ticketing.service.TicketService;
import com.codelogium.ticketing.service.UserService;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@EnableMethodSecurity // apply security measures at method level
@AllArgsConstructor
@Tag(name = "Ticket Controller", description = "Manages support tickets for users")
@RequestMapping(value = "/tickets", produces = MediaType.APPLICATION_JSON_VALUE)
public class TicketController {

    private final TicketService ticketService;
    private final UserService userService;

    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tickets successfully retrieved", content = @Content(schema = @Schema(implementation = Map.class))),
            @ApiResponse(ref = "#/components/responses/401")
    })
    @Operation(summary = "Get Tickets with Pagination", description = "Role-based ticket retrieval with pagination: User sees own tickets, Admin sees all tickets, Support Agent sees assigned tickets")
    @GetMapping
    public ResponseEntity<Map<String, Object>> getTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Status status,
            @RequestParam(required = false) com.codelogium.ticketing.entity.enums.Priority priority) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User currentUser = userService.retrieveUser(email);

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        boolean hasFilters = (search != null && !search.isBlank()) || status != null || priority != null;
        Page<Ticket> ticketPage = switch (currentUser.getRole()) {
            case USER -> hasFilters
                    ? ticketService.retrieveTicketsByCreatorPaginatedFiltered(currentUser.getId(), search, status,
                            priority, pageable)
                    : ticketService.retrieveTicketsByCreatorPaginated(currentUser.getId(), pageable);
            case ADMIN -> hasFilters
                    ? ticketService.getAllTicketsPaginatedFiltered(search, status, priority, pageable)
                    : ticketService.getAllTicketsPaginated(pageable);
            case SUPPORT_AGENT -> hasFilters
                    ? ticketService.getTicketsByAssigneePaginatedFiltered(currentUser.getId(), search, status, priority,
                            pageable)
                    : ticketService.getTicketsByAssigneePaginated(currentUser.getId(), pageable);
            default -> Page.empty(pageable);
        };

        List<TicketDTO> ticketDTOs = ticketService.convertToDTOList(ticketPage.getContent());

        Map<String, Object> response = new HashMap<>();
        response.put("tickets", ticketDTOs);
        response.put("currentPage", ticketPage.getNumber());
        response.put("totalItems", ticketPage.getTotalElements());
        response.put("totalPages", ticketPage.getTotalPages());
        response.put("size", ticketPage.getSize());
        response.put("hasNext", ticketPage.hasNext());
        response.put("hasPrevious", ticketPage.hasPrevious());

        return ResponseEntity.ok(response);
    }

    // Overload for backward-compatibility in tests (no filters)
    public ResponseEntity<Map<String, Object>> getTickets(
            int page,
            int size,
            String sortBy,
            String sortDir) {
        return getTickets(page, size, sortBy, sortDir, null, null, null);
    }

    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Ticket successfully created", content = @Content(schema = @Schema(implementation = Ticket.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request: unsuccessful submission"),
            @ApiResponse(ref = "#/components/responses/401"),
            @ApiResponse(ref = "#/components/responses/403")
    })
    @Operation(summary = "Create Ticket", description = "Creates a new support ticket")
    @PreAuthorize("hasAnyAuthority('USER', 'ADMIN')")
    @PostMapping
    public ResponseEntity<String> createTicket(@RequestBody @Valid Ticket newTicket) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User currentUser = userService.retrieveUser(email);

        ticketService.createTicket(currentUser.getId(), newTicket);
        return ResponseEntity.status(HttpStatus.CREATED).body("Ticket created successfully");
    }

    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Ticket successfully retrieved", content = @Content(schema = @Schema(implementation = TicketDTO.class))),
            @ApiResponse(responseCode = "404", description = "Ticket not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(ref = "#/components/responses/401")
    })
    @Operation(summary = "Get Ticket", description = "Retrieves a ticket by ID")
    @GetMapping("/{ticketId}")
    public ResponseEntity<TicketDTO> retrieveTicket(@PathVariable Long ticketId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User currentUser = userService.retrieveUser(email);

        return switch (currentUser.getRole()) {
            case ADMIN, SUPPORT_AGENT -> {
                Ticket ticket = ticketService.retrieveTicketById(ticketId);
                yield ResponseEntity.ok(ticketService.convertToDTO(ticket));
            }
            case USER -> {
                Ticket userTicket = ticketService.retrieveTicket(ticketId, currentUser.getId());
                yield ResponseEntity.ok(ticketService.convertToDTO(userTicket));
            }
            default -> ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        };
    }

    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Ticket successfully updated", content = @Content(schema = @Schema(implementation = TicketDTO.class))),
            @ApiResponse(responseCode = "404", description = "Ticket not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(ref = "#/components/responses/401"),
            @ApiResponse(ref = "#/components/responses/403")
    })
    @Operation(summary = "Update Ticket Info", description = "Update an existing ticket's details")
    @PreAuthorize("hasAnyAuthority('USER', 'ADMIN', 'SUPPORT_AGENT')")
    @PatchMapping("/{ticketId}/info")
    public ResponseEntity<TicketDTO> updateTicketInfo(@PathVariable Long ticketId,
            @RequestBody @Valid TicketInfoUpdateDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User currentUser = userService.retrieveUser(email);

        return switch (currentUser.getRole()) {
            case ADMIN, SUPPORT_AGENT -> {
                Ticket updatedTicket = ticketService.updateTicketInfoByRole(ticketId, currentUser.getId(), dto,
                        currentUser.getRole());
                yield ResponseEntity.ok(ticketService.convertToDTO(updatedTicket));
            }
            case USER -> {
                Ticket userUpdatedTicket = ticketService.updateTicketInfo(ticketId, currentUser.getId(), dto);
                yield ResponseEntity.ok(ticketService.convertToDTO(userUpdatedTicket));
            }
            default -> ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        };
    }

    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Ticket successfully updated", content = @Content(schema = @Schema(implementation = TicketDTO.class))),
            @ApiResponse(responseCode = "404", description = "Ticket not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(ref = "#/components/responses/401"),
            @ApiResponse(ref = "#/components/responses/403")
    })
    @Operation(summary = "Update Ticket Status", description = "Update an existing ticket's status")
    @PreAuthorize("hasAnyAuthority('SUPPORT_AGENT', 'ADMIN')")
    @PatchMapping("/{ticketId}/status")
    public ResponseEntity<TicketDTO> updateTicketStatus(@PathVariable Long ticketId,
            @RequestBody @Valid TicketStatusUpdateDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User currentUser = userService.retrieveUser(email);

        switch (currentUser.getRole()) {
            case ADMIN:
            case SUPPORT_AGENT:
                Ticket updatedTicket = ticketService.updateTicketStatusByRole(ticketId, currentUser.getId(), dto,
                        currentUser.getRole());
                return ResponseEntity.ok(ticketService.convertToDTO(updatedTicket));
            default:
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Ticket successfully assigned", content = @Content(schema = @Schema(implementation = TicketDTO.class))),
            @ApiResponse(responseCode = "404", description = "Ticket or assigned user not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(ref = "#/components/responses/401"),
            @ApiResponse(ref = "#/components/responses/403")
    })
    @Operation(summary = "Assign Ticket", description = "Assign a ticket to a support agent (Admin only) or reassign ticket (Support Agent)")
    @PreAuthorize("hasAnyAuthority('SUPPORT_AGENT', 'ADMIN')")
    @PatchMapping("/{ticketId}/assign")
    public ResponseEntity<TicketDTO> assignTicket(@PathVariable Long ticketId,
            @RequestBody @Valid TicketAssignmentDTO assignmentDTO) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User currentUser = userService.retrieveUser(email);

        switch (currentUser.getRole()) {
            case ADMIN:
                Ticket assignedTicket = ticketService.assignTicket(ticketId, assignmentDTO, currentUser.getId());
                return ResponseEntity.ok(ticketService.convertToDTO(assignedTicket));
            case SUPPORT_AGENT:
                Ticket reassignedTicket = ticketService.assignTicket(ticketId, assignmentDTO, currentUser.getId());
                return ResponseEntity.ok(ticketService.convertToDTO(reassignedTicket));
            default:
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Assignable support agents successfully retrieved", content = @Content(array = @ArraySchema(schema = @Schema(implementation = SupportAgentDTO.class)))),
            @ApiResponse(ref = "#/components/responses/401"),
            @ApiResponse(ref = "#/components/responses/403")
    })
    @Operation(summary = "Get Assignable Support Agents", description = "Retrieves support agents that can be assigned tickets. For Support Agents: other agents excluding themselves. For Admins: all support agents.")
    @PreAuthorize("hasAnyAuthority('SUPPORT_AGENT', 'ADMIN')")
    @GetMapping("/assignable-agents")
    public ResponseEntity<List<SupportAgentDTO>> getAssignableSupportAgents() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User currentUser = userService.retrieveUser(email);

        List<SupportAgentDTO> agents = userService.getAssignableSupportAgents(currentUser.getId(),
                currentUser.getRole());
        return ResponseEntity.ok(agents);
    }

    // Legacy /tickets/{ticketId}/search endpoint removed in favor of filters on GET
    // /tickets

    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Audit logs successfully retrieved", content = @Content(schema = @Schema(implementation = AuditLog.class))),
            @ApiResponse(responseCode = "404", description = "Ticket not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(ref = "#/components/responses/401"),
            @ApiResponse(ref = "#/components/responses/403")
    })
    @Operation(summary = "Audit Tickets Logs", description = "Retrieves audit logs of a ticket")
    @PreAuthorize("hasAnyAuthority('SUPPORT_AGENT', 'ADMIN')")
    @GetMapping("/{ticketId}/audit-logs")
    public ResponseEntity<List<AuditLog>> retrieveAuditLogs(@PathVariable Long ticketId) {
        return ResponseEntity.ok(ticketService.retrieveAuditLogs(ticketId, ticketId));
    }

    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Ticket successfully deleted"),
            @ApiResponse(responseCode = "404", description = "Ticket not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(ref = "#/components/responses/401")
    })
    @Operation(summary = "Delete Ticket", description = "Deletes a ticket by ID")
    @DeleteMapping("/{ticketId}")
    public ResponseEntity<Void> removeTicket(@PathVariable Long ticketId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User currentUser = userService.retrieveUser(email);

        switch (currentUser.getRole()) {
            case ADMIN:
                ticketService.removeTicket(ticketId, currentUser.getId());
                break;
            case USER:
                ticketService.removeTicket(ticketId, currentUser.getId());
                break;
            case SUPPORT_AGENT:
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            default:
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.noContent().build();
    }
}
