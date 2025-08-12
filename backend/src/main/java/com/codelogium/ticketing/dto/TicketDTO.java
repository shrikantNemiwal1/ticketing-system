package com.codelogium.ticketing.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.codelogium.ticketing.entity.enums.Status;
import com.codelogium.ticketing.entity.enums.Category;
import com.codelogium.ticketing.entity.enums.Priority;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.ALWAYS) // Include all fields, even if null
public class TicketDTO {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime creationDate;
    private Status status;
    private Category category;
    private Priority priority;
    private UserBasicDTO assignedTo;
    private LocalDateTime assignedAt;
    private UserBasicDTO assignedBy;
    private UserBasicDTO createdBy;
}
