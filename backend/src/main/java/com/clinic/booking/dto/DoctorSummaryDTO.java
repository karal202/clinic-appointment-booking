package com.clinic.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorSummaryDTO {
    private Long id;
    private String fullName;
    private String avatar;
    private BigDecimal ratingAvg;
    private Integer ratingCount;
    private BigDecimal feeMin;
    private BigDecimal feeMax;
    private Integer experienceYears;
    private String workingRoom;
    private SpecialtyDTO specialty;
    private HospitalSummaryDTO hospital;
}
