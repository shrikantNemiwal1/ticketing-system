package com.codelogium.ticketing.service;

import static com.codelogium.ticketing.util.EntityUtils.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.codelogium.ticketing.dto.CommentDTO;
import com.codelogium.ticketing.entity.AuditLog;
import com.codelogium.ticketing.entity.Comment;
import com.codelogium.ticketing.entity.Ticket;
import com.codelogium.ticketing.entity.User;
import com.codelogium.ticketing.entity.enums.UserRole;
import com.codelogium.ticketing.exception.ResourceNotFoundException;
import com.codelogium.ticketing.repository.AuditLogRepository;
import com.codelogium.ticketing.repository.CommentRepository;
import com.codelogium.ticketing.repository.TicketRepository;
import com.codelogium.ticketing.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class CommentServiceImp implements CommentService {

    private CommentRepository commentRepository;
    private TicketRepository ticketRepository;
    private AuditLogRepository auditLogRepository;
    private UserRepository userRepository; // only for validation

    @Override
    public Comment createComment(Long ticketId, Long userId, Comment newComment) {
        User author = UserServiceImp.unwrapUser(userId, userRepository.findById(userId));

        // ensure user->ticket relationship
        Ticket retrieveTicket = TicketServiceImp.unwrapTicket(ticketId,
                ticketRepository.findByIdAndCreatorId(ticketId, userId));

        newComment.setTicket(retrieveTicket);
        newComment.setAuthor(author);
        newComment.setCreatedAt(Instant.now());
        Comment createdComment = commentRepository.save(newComment);

        // Log ticket creation
        auditLogRepository.save(new AuditLog(
                retrieveTicket.getId(),
                ticketId,
                createdComment.getId(),
                userId,
                "COMMENT_ADDED",
                null,
                createdComment.getContent(),
                Instant.now()));

        return createdComment;
    }

    @Override
    public Comment createCommentByRole(Long ticketId, Long userId, Comment newComment, UserRole userRole) {
        User author = UserServiceImp.unwrapUser(userId, userRepository.findById(userId));

        Ticket retrieveTicket;
        switch (userRole) {
            case ADMIN:
            case SUPPORT_AGENT:
                // Admins and support agents can comment on any ticket
                retrieveTicket = TicketServiceImp.unwrapTicket(ticketId,
                        ticketRepository.findById(ticketId));
                break;
            case USER:
                // Users can only comment on their own tickets
                retrieveTicket = TicketServiceImp.unwrapTicket(ticketId,
                        ticketRepository.findByIdAndCreatorId(ticketId, userId));
                break;
            default:
                throw new IllegalArgumentException("Invalid user role: " + userRole);
        }

        newComment.setTicket(retrieveTicket);
        newComment.setAuthor(author);
        newComment.setCreatedAt(Instant.now());
        Comment createdComment = commentRepository.save(newComment);

        // Log comment creation
        auditLogRepository.save(new AuditLog(
                retrieveTicket.getId(),
                ticketId,
                createdComment.getId(),
                userId,
                "COMMENT_ADDED",
                null,
                createdComment.getContent(),
                Instant.now()));

        auditLogRepository.flush(); // Ensure immediate persistence

        return createdComment;
    }

    @Transactional
    @Override
    public Comment updateComment(Long commentId, Long ticketId, Long userId, Comment newComment) {
        // Verify user existance by checking the creator relationship
        validateUser(userId);
        // Get the ticket and verify it belongs to this user
        Ticket ticket = TicketServiceImp.unwrapTicket(ticketId,
                ticketRepository.findByIdAndCreatorId(ticketId, userId));

        Comment retrievedComment = unwrapComment(commentId,
                commentRepository.findByIdAndTicketIdAndAuthorId(commentId, ticketId, userId));
        // Store old content value before making changes
        String content = retrievedComment.getContent();
        updateIfNotNull(retrievedComment::setContent, newComment.getContent());
        updateIfNotNull(retrievedComment::setTicket, newComment.getTicket());

        // if the user changed the content of the comment, update the timestamp
        Comment savedComment = new Comment();
        if (newComment.getContent().equals(retrievedComment.getContent())) {
            updateIfNotNull(retrievedComment::setCreatedAt, Instant.now());
            // attempts to save comment
            savedComment = commentRepository.save(retrievedComment);

            // Log ticket creation
            auditLogRepository.save(new AuditLog(
                    null,
                    ticket.getId(),
                    retrievedComment.getId(),
                    userId,
                    "COMMENT_UPDATED",
                    content,
                    retrievedComment.getContent(),
                    Instant.now()));

            auditLogRepository.flush(); // Ensure immediate persistence
        }
        return savedComment;
    }

    @Override
    public Comment retrieveComment(Long userId, Long ticketId, Long commentId) {
        // Verify user existance by checking the creator relationship
        validateUser(userId);
        // Get the ticket and verify it belongs to this user
        TicketServiceImp.unwrapTicket(ticketId, ticketRepository.findByIdAndCreatorId(ticketId, userId));

        // Attempts to retrieve the corresponding comment
        Comment retrievedComment = unwrapComment(commentId,
                commentRepository.findByIdAndTicketIdAndAuthorId(commentId, ticketId, userId));

        return retrievedComment;
    }

    @Override
    public List<AuditLog> retrieveAuditLogs(Long commentId, Long ticketId, Long userId) {
        validateUser(userId);

        TicketServiceImp.unwrapTicket(ticketId, ticketRepository.findByIdAndCreatorId(ticketId, userId));

        unwrapComment(commentId, commentRepository.findByIdAndTicketIdAndAuthorId(commentId, ticketId, userId));

        return auditLogRepository.findByCommentId(commentId);
    }

    @Override
    public void removeComment(Long commentId, Long ticketId, Long userId) {
        // Check user exists
        validateUser(userId);
        Ticket retrievedTicket = TicketServiceImp.unwrapTicket(ticketId,
                ticketRepository.findByIdAndCreatorId(ticketId, userId));

        Comment retrievedComment = unwrapComment(commentId,
                commentRepository.findByIdAndTicketIdAndAuthorId(commentId, ticketId, userId));

        retrievedTicket.getComments().remove(retrievedComment);
        ticketRepository.save(retrievedTicket); // triggers orphanRemoval on ticket level

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

    @Override
    public List<Comment> getAllCommentsForTicket(Long ticketId, Long userId) {
        // Validate that the user exists
        validateUser(userId);

        // Validate that the ticket exists and belongs to the user
        Ticket ticket = TicketServiceImp.unwrapTicket(ticketId,
                ticketRepository.findByIdAndCreatorId(ticketId, userId));

        // Return all comments for this ticket
        return ticket.getComments();
    }

    @Override
    public List<Comment> getAllCommentsForTicketByRole(Long ticketId, Long userId, UserRole userRole) {
        // Validate that the user exists
        validateUser(userId);

        Ticket ticket;
        switch (userRole) {
            case ADMIN:
            case SUPPORT_AGENT:
                // Admins and support agents can access any ticket
                ticket = TicketServiceImp.unwrapTicket(ticketId,
                        ticketRepository.findById(ticketId));
                break;
            case USER:
                // Users can only access their own tickets
                ticket = TicketServiceImp.unwrapTicket(ticketId,
                        ticketRepository.findByIdAndCreatorId(ticketId, userId));
                break;
            default:
                throw new IllegalArgumentException("Invalid user role: " + userRole);
        }

        // Return all comments for this ticket
        return ticket.getComments();
    }

    @Override
    public CommentDTO convertToDTO(Comment comment) {
        CommentDTO dto = new CommentDTO();
        dto.setId(comment.getId());
        dto.setContent(comment.getContent());
        dto.setCreatedAt(comment.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime());

        // Convert author to CommentAuthorDTO
        if (comment.getAuthor() != null) {
            CommentDTO.CommentAuthorDTO authorDTO = new CommentDTO.CommentAuthorDTO();
            authorDTO.setId(comment.getAuthor().getId());
            authorDTO.setEmail(comment.getAuthor().getEmail());
            authorDTO.setRole(comment.getAuthor().getRole());
            dto.setAuthor(authorDTO);
        }

        return dto;
    }

    @Override
    public List<CommentDTO> convertToDTOList(List<Comment> comments) {
        return comments.stream()
                .map(this::convertToDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    public static Comment unwrapComment(Long commentId, Optional<Comment> optionalComment) {
        return optionalComment.orElseThrow(() -> new ResourceNotFoundException(commentId, Comment.class));
    }
}
