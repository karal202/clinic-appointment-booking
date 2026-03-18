package com.clinic.booking.dto;

import com.clinic.booking.entity.Appointment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentDTO {
    private Long id;
    private String appointmentCode;
    private LocalDate appointmentDate;
    private LocalTime appointmentTime;
    private Appointment.AppointmentStatus status;
    private Appointment.PaymentStatus paymentStatus;
    private String assignedRoom;
    private Integer queueNumber;
    private String patientName;
    private String patientPhone;
    private String patientAddress;
    private DoctorSummaryDTO doctor;
    private HospitalSummaryDTO hospital;
}
