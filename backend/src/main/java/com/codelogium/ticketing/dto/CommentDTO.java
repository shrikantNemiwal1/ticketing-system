package com.codelogium.ticketing.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.codelogium.ticketing.entity.enums.UserRole;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentDTO {
    private Long id;
    private String content;
    private LocalDateTime createdAt;
    private CommentAuthorDTO author;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommentAuthorDTO {
        private Long id;
        private String email;
        private UserRole role;
    }
}
