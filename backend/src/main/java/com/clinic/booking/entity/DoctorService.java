package com.clinic.booking.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

@Entity
@Table(name = "doctor_services")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorService {

    @EmbeddedId
    private DoctorServiceId id;

    @ManyToOne
    @MapsId("doctorId")
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    @ManyToOne
    @MapsId("serviceId")
    @JoinColumn(name = "service_id")
    private Service service;

    @Column(precision = 12, scale = 2)
    private BigDecimal price;

    // Composite key
    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DoctorServiceId implements Serializable {
        private Long doctorId;
        private Long serviceId;
    }
}