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
public class MedicalRecordDTO {
    private Long id;
    private Long appointmentId;
    private Long userId;
    private String userName;
    private Long doctorId;
    private String doctorName;
    private String symptoms;
    private String diagnosis;
    private String treatmentPlan;
    private String prescription;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
