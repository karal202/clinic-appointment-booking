package com.clinic.booking.repository;

import com.clinic.booking.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {
    List<MedicalRecord> findByUserId(Long userId);

    List<MedicalRecord> findByDoctorId(Long doctorId);

    Optional<MedicalRecord> findByAppointmentId(Long appointmentId);
}
