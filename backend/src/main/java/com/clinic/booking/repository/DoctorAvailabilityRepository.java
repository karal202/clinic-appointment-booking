package com.clinic.booking.repository;

import com.clinic.booking.entity.DoctorAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Long> {
    List<DoctorAvailability> findByDoctorIdAndDayOfWeekAndIsActiveTrue(Long doctorId, Integer dayOfWeek);
}
