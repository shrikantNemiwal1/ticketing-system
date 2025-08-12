package com.codelogium.ticketing.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRegistrationDTO {

    @NotBlank(message = "Email cannot be null or blank")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password cannot be null or blank")
    @Size(min = 6, message = "Password must be at least 6 characters long")
    private String password;
}
