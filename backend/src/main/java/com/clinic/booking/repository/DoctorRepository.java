package com.clinic.booking.repository;

import com.clinic.booking.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

       Optional<Doctor> findByUserId(Long userId);

       List<Doctor> findByIsActiveTrueAndIsAvailableForBookingTrue();

       List<Doctor> findByHospitalIdAndIsActiveTrue(Long hospitalId);
       
       List<Doctor> findByHospitalId(Long hospitalId);

       List<Doctor> findBySpecialtyIdAndIsActiveTrue(Long specialtyId);
       
       List<Doctor> findBySpecialtyId(Long specialtyId);

       @Query("SELECT d FROM Doctor d WHERE d.hospital.id = :hospitalId AND " +
                     "d.specialty.id = :specialtyId AND d.isActive = true AND d.isAvailableForBooking = true")
       List<Doctor> findByHospitalAndSpecialty(@Param("hospitalId") Long hospitalId,
                     @Param("specialtyId") Long specialtyId);

       @Query("SELECT d FROM Doctor d WHERE d.isActive = true AND d.isAvailableForBooking = true AND " +
                     "(LOWER(d.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                     "LOWER(d.specialty.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                     "LOWER(d.hospital.name) LIKE LOWER(CONCAT('%', :keyword, '%')))")
       List<Doctor> searchDoctors(@Param("keyword") String keyword);

       @Query("SELECT d FROM Doctor d WHERE d.isActive = true AND d.isAvailableForBooking = true " +
                     "ORDER BY d.ratingAvg DESC")
       List<Doctor> findTopRatedDoctors();

       @Query("SELECT d FROM Doctor d WHERE d.isActive = true AND d.isAvailableForBooking = true " +
                     "AND (:keyword IS NULL OR LOWER(d.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
                     "AND (:specialtyId IS NULL OR d.specialty.id = :specialtyId) " +
                     "AND (:hospitalId IS NULL OR d.hospital.id = :hospitalId)")
       List<Doctor> searchDoctorsWithFilters(@Param("keyword") String keyword,
                     @Param("specialtyId") Long specialtyId,
                     @Param("hospitalId") Long hospitalId);
}