package com.clinic.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorDTO {
    private Long id;
    private Long userId;
    private String fullName;
    private String gender;
    private LocalDate dateOfBirth;
    private String phone;
    private String avatar;
    private String licenseNo;
    private Integer experienceYears;
    private String bio;
    private SpecialtyDTO specialty;
    private HospitalSummaryDTO hospital;
    private BigDecimal feeMin;
    private BigDecimal feeMax;
    private BigDecimal ratingAvg;
    private Integer ratingCount;
    private String workingRoom;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
