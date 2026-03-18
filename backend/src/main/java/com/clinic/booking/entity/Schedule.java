package com.clinic.booking.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "schedules")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    // Session (morning, afternoon, evening)
    @Enumerated(EnumType.STRING)
    @Column
    private Session session;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "is_available", nullable = false)
    private Boolean isAvailable = true;

    @Column(name = "booked_patients", nullable = false)
    private Integer bookedPatients = 0;

    @Column(name = "max_patients", nullable = false)
    private Integer maxPatients = 1;

    // Thời gian bắt đầu (DATETIME)
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    // Thời gian kết thúc (DATETIME) - tự động tính bằng trigger
    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    // Số phút của slot (30, 60, etc.)
    @Column(name = "slot_minutes", nullable = false)
    private Integer slotMinutes = 60;

    // Phòng khám
    @Column(length = 64)
    private String room;

    // Sức chứa (số bệnh nhân tối đa)
    @Column(nullable = false)
    private Integer capacity = 1;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Session enum
    public enum Session {
        morning,
        afternoon,
        evening;

        public String getValue() {
            return this.name();
        }
    }

    // Helper method to check if slot has available capacity
    // Note: This should be checked against actual appointments in the service layer
    @Transient
    public boolean hasAvailableCapacity(int currentBookings) {
        return currentBookings < capacity;
    }
}