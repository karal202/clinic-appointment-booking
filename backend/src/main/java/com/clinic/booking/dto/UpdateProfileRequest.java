package com.clinic.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @Pattern(regexp = "^(\\+84|0)\\d{9,10}$", message = "Phone number must be valid (Vietnamese format)")
    private String phoneNumber;

    private String address;
    private String gender;
    private LocalDateTime dateOfBirth;
}