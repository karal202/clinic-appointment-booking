package com.clinic.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class WalkInRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^(\\+84|0)\\d{9,10}$", message = "Phone number must be valid (Vietnamese format)")
    private String phoneNumber;

    private String gender;

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    private String symptomsNote;
}
