package com.clinic.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    
    private Long id;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String address;
    private String gender;
    private LocalDateTime dateOfBirth;
    private String avatar;
    private String role;
    private Boolean emailVerified;
    private LocalDateTime createdAt;
}