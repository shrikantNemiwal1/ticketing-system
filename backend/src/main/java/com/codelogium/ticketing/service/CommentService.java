package com.codelogium.ticketing.service;

import java.util.List;

import com.codelogium.ticketing.dto.CommentDTO;
import com.codelogium.ticketing.entity.AuditLog;
import com.codelogium.ticketing.entity.Comment;
import com.codelogium.ticketing.entity.enums.UserRole;

public interface CommentService {
    Comment createComment(Long ticketId, Long userId, Comment comment);

    Comment createCommentByRole(Long ticketId, Long userId, Comment comment, UserRole userRole);

    Comment updateComment(Long commentId, Long ticketId, Long userId, Comment newComment);

    Comment retrieveComment(Long userId, Long ticketId, Long commentId);

    void removeComment(Long commentId, Long ticketId, Long userId);

    List<AuditLog> retrieveAuditLogs(Long commentId, Long ticketId, Long userId);

    List<Comment> getAllCommentsForTicket(Long ticketId, Long userId);

    List<Comment> getAllCommentsForTicketByRole(Long ticketId, Long userId, UserRole userRole);

    // DTO conversion methods
    CommentDTO convertToDTO(Comment comment);

    List<CommentDTO> convertToDTOList(List<Comment> comments);
}
