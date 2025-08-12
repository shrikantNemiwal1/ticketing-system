package com.codelogium.ticketing.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketAssignmentDTO {
    @NotNull(message = "Assigned agent ID cannot be null")
    private Long assignedToId;
}
