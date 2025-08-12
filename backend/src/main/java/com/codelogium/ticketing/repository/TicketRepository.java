package com.codelogium.ticketing.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.codelogium.ticketing.entity.Ticket;
import com.codelogium.ticketing.entity.User;
import com.codelogium.ticketing.entity.enums.Priority;
import com.codelogium.ticketing.entity.enums.Status;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

  Optional<Ticket> findByIdAndCreatorId(Long ticketId, Long userId);

  List<Ticket> findByCreatorId(Long userId);

  // Find creator by ticket id to validates user in this and sub-level
  @Query("SELECT t.creator FROM Ticket t WHERE t.id = :ticketId")
  Optional<User> findCreatorByTicket(@Param("ticketId") Long ticketId);

  // Filtered search across all tickets
  @Query("""
          SELECT t FROM Ticket t
          WHERE (:search IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%')))
            AND (:status IS NULL OR t.status = :status)
            AND (:priority IS NULL OR t.priority = :priority)
      """)
  Page<Ticket> findAllFiltered(
      @Param("search") String search,
      @Param("status") Status status,
      @Param("priority") Priority priority,
      Pageable pageable);

  // Filtered search limited to creator
  @Query("""
          SELECT t FROM Ticket t
          WHERE t.creator.id = :userId
            AND (:search IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%')))
            AND (:status IS NULL OR t.status = :status)
            AND (:priority IS NULL OR t.priority = :priority)
      """)
  Page<Ticket> findByCreatorIdFiltered(
      @Param("userId") Long userId,
      @Param("search") String search,
      @Param("status") Status status,
      @Param("priority") Priority priority,
      Pageable pageable);

  // Filtered search limited to assignee
  @Query("""
          SELECT t FROM Ticket t
          WHERE t.assignedTo.id = :assigneeId
            AND (:search IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%')))
            AND (:status IS NULL OR t.status = :status)
            AND (:priority IS NULL OR t.priority = :priority)
      """)
  Page<Ticket> findByAssignedToIdFiltered(
      @Param("assigneeId") Long assigneeId,
      @Param("search") String search,
      @Param("status") Status status,
      @Param("priority") Priority priority,
      Pageable pageable);

  // Assignment queries
  List<Ticket> findByAssignedToId(Long assigneeId);

  List<Ticket> findByAssignedToIsNull();

  // Custom queries with JOIN FETCH to ensure creator is loaded
  @Query("SELECT t FROM Ticket t JOIN FETCH t.creator")
  List<Ticket> findAllWithCreator();

  @Query("SELECT t FROM Ticket t JOIN FETCH t.creator WHERE t.creator.id = :userId")
  List<Ticket> findByCreatorIdWithCreator(@Param("userId") Long userId);

  @Query("SELECT t FROM Ticket t JOIN FETCH t.creator WHERE t.assignedTo.id = :assigneeId")
  List<Ticket> findByAssignedToIdWithCreator(@Param("assigneeId") Long assigneeId);

  // Paginated methods with JOIN FETCH
  Page<Ticket> findAll(Pageable pageable);

  Page<Ticket> findByCreatorId(@Param("userId") Long userId, Pageable pageable);

  Page<Ticket> findByAssignedToId(@Param("assigneeId") Long assigneeId, Pageable pageable);
}