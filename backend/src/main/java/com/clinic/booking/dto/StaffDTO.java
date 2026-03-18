package com.clinic.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffDTO {
    private Long id;
    private Long userId;
    private String userEmail;
    private String userFullName;
    private String password; // Added for new account creation
    private Long hospitalId;
    private String hospitalName;
    private String position;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
