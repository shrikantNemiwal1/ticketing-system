package com.codelogium.ticketing.web;

import com.codelogium.ticketing.dto.SupportAgentDTO;
import com.codelogium.ticketing.entity.User;
import com.codelogium.ticketing.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/support")
@RequiredArgsConstructor
@Tag(name = "Support Agent Management", description = "Support agent endpoints for agent management")
@SecurityRequirement(name = "Bearer Authentication")
public class SupportController {

    private final UserService userService;

    @GetMapping("/agents")
    @PreAuthorize("hasAnyAuthority('SUPPORT_AGENT', 'ADMIN')")
    @Operation(summary = "Get support agents", description = "Get list of support agents for reassignment")
    public ResponseEntity<List<SupportAgentDTO>> getSupportAgents() {
        List<User> supportAgents = userService.getSupportAgents();

        // Convert to DTO with only id and email
        List<SupportAgentDTO> agentDTOs = supportAgents.stream()
                .map(agent -> new SupportAgentDTO(agent.getId(), agent.getEmail()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(agentDTOs);
    }
}
