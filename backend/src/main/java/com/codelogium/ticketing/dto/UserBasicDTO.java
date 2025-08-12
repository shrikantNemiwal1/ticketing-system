package com.codelogium.ticketing.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.codelogium.ticketing.entity.enums.UserRole;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserBasicDTO {
    private Long id;
    private String email;
    private UserRole role;
}
