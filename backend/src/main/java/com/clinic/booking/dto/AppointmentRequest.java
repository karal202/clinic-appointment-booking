package com.clinic.booking.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AppointmentRequest {
    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    @NotNull(message = "Slot ID is required")
    private Long slotId;

    @NotNull(message = "Appointment date is required")
    @FutureOrPresent(message = "Appointment date must be in the present or future")
    private LocalDate appointmentDate;

    @NotNull(message = "Appointment time is required")
    private LocalTime appointmentTime;

    private String symptomsNote;

    // Optional patient details
    private String patientName;

    @Pattern(regexp = "^(\\+84|0)\\d{9,10}$", message = "Phone number must be valid (Vietnamese format)")
    private String patientPhone;

    private String patientAddress;

    private String paymentMethod;
}
