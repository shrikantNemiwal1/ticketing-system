package com.codelogium.ticketing.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.codelogium.ticketing.dto.TicketAssignmentDTO;
import com.codelogium.ticketing.dto.TicketDTO;
import com.codelogium.ticketing.dto.TicketInfoUpdateDTO;
import com.codelogium.ticketing.dto.TicketStatusUpdateDTO;
import com.codelogium.ticketing.entity.AuditLog;
import com.codelogium.ticketing.entity.Ticket;
import com.codelogium.ticketing.entity.enums.Status;
import com.codelogium.ticketing.entity.enums.UserRole;

public interface TicketService {
    Ticket createTicket(Long userId, Ticket newTicket);

    Ticket updateTicketInfo(Long ticketId, Long userId, TicketInfoUpdateDTO dto);

    Ticket updateTicketInfoByRole(Long ticketId, Long userId, TicketInfoUpdateDTO dto, UserRole userRole);

    Ticket updateTicketStatus(Long ticketId, Long userId, TicketStatusUpdateDTO dto);

    Ticket updateTicketStatusByRole(Long ticketId, Long userId, TicketStatusUpdateDTO dto, UserRole userRole);

    Ticket retrieveTicket(Long ticketId, Long userId);

    Ticket retrieveTicketById(Long ticketId); // New method for admin/agent access

    void removeTicket(Long ticketId, Long userid);

    List<Ticket> retrieveTicketsByCreator(Long userId);

    // Deprecated search by id and status removed in favor of list filters

    List<AuditLog> retrieveAuditLogs(Long ticketId, Long userId);

    // Assignment methods
    Ticket assignTicket(Long ticketId, TicketAssignmentDTO assignmentDTO, Long assignedBy);

    List<Ticket> getAllTickets();

    List<Ticket> getTicketsByAssignee(Long assigneeId);

    List<Ticket> getUnassignedTickets();

    // Paginated methods
    Page<Ticket> getAllTicketsPaginated(Pageable pageable);

    Page<Ticket> retrieveTicketsByCreatorPaginated(Long userId, Pageable pageable);

    Page<Ticket> getTicketsByAssigneePaginated(Long assigneeId, Pageable pageable);

    // Paginated methods with filters
    Page<Ticket> getAllTicketsPaginatedFiltered(String search, Status status,
            com.codelogium.ticketing.entity.enums.Priority priority, Pageable pageable);

    Page<Ticket> retrieveTicketsByCreatorPaginatedFiltered(Long userId, String search, Status status,
            com.codelogium.ticketing.entity.enums.Priority priority, Pageable pageable);

    Page<Ticket> getTicketsByAssigneePaginatedFiltered(Long assigneeId, String search, Status status,
            com.codelogium.ticketing.entity.enums.Priority priority, Pageable pageable);

    // DTO conversion methods
    TicketDTO convertToDTO(Ticket ticket);

    List<TicketDTO> convertToDTOList(List<Ticket> tickets);
}
