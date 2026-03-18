package com.clinic.booking.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "appointments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "appointment_code", unique = true, length = 64)
    private String appointmentCode;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "appointment_time", nullable = false)
    private LocalTime appointmentTime;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @ManyToOne
    @JoinColumn(name = "schedule_id", nullable = true)
    private Schedule schedule;

    @ManyToOne
    @JoinColumn(name = "hospital_id")
    private Hospital hospital;

    // Trạng thái
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status = AppointmentStatus.PENDING;

    // Lý do hủy
    @Column(name = "cancel_reason", length = 255)
    private String cancelReason;

    // Ghi chú triệu chứng
    @Column(name = "symptoms_note", length = 255)
    private String symptomsNote;

    @Column(name = "assigned_room", length = 64)
    private String assignedRoom;

    @Column(name = "queue_number")
    private Integer queueNumber;

    // Patient-provided snapshot (name/phone/address) — optional, overrides user data for this appointment
    @Column(name = "patient_name", length = 255)
    private String patientName;

    @Column(name = "patient_phone", length = 64)
    private String patientPhone;

    @Column(name = "patient_address", length = 512)
    private String patientAddress;

    // Trạng thái thanh toán
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    // Thời gian
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Generated column for preventing duplicate active bookings
    // This is handled by database, no need to map in JPA
    @Column(name = "active_key", insertable = false, updatable = false)
    private Integer activeKey;

    // Enums
    public enum AppointmentStatus {
        PENDING, // pending
        CONFIRMED, // confirmed
        CHECKED_IN, // checked_in
        COMPLETED, // completed
        CANCELLED, // cancelled
        NO_SHOW // no_show
    }

    public enum PaymentStatus {
        UNPAID, // unpaid
        PAID, // paid
        REFUNDED // refunded
    }
}