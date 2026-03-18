package com.clinic.booking.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "hospitals")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Hospital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Boolean isActive = true;

    @Column(nullable = false)
    private Boolean isVerified = true;

    @Column(length = 100)
    private String city;

    @Column(precision = 3, scale = 2)
    private java.math.BigDecimal rating;

    @Column(nullable = false, unique = true, length = 191)
    private String name;

    @Column(length = 255)
    private String address;

    @Column(length = 32)
    private String phone;

    @Column(name = "image_url", length = 512)
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String details;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ElementCollection
    @CollectionTable(name = "hospital_rooms", joinColumns = @JoinColumn(name = "hospital_id"))
    @Column(name = "room_name")
    private List<String> rooms;

    // Relationships
    @OneToMany(mappedBy = "hospital", cascade = CascadeType.ALL)
    private List<Doctor> doctors;

    @OneToMany(mappedBy = "hospital", cascade = CascadeType.ALL)
    private List<Staff> staff;

    @ManyToMany
    @JoinTable(name = "hospital_specialties", joinColumns = @JoinColumn(name = "hospital_id"), inverseJoinColumns = @JoinColumn(name = "specialty_id"))
    private List<Specialty> specialties;
}