package com.codelogium.ticketing.entity.enums;

public enum UserRole {
    USER, // Regular users who can create and manage their own tickets
    SUPPORT_AGENT, // Support staff who can manage assigned tickets
    ADMIN // Administrators with full system access
}
