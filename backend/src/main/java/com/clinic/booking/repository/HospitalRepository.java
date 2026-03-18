package com.clinic.booking.repository;

import com.clinic.booking.entity.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HospitalRepository extends JpaRepository<Hospital, Long> {
    
    List<Hospital> findByIsActiveTrue();
    
    List<Hospital> findByIsActiveTrueAndIsVerifiedTrue();
    
    @Query("SELECT h FROM Hospital h WHERE h.isActive = true AND " +
           "(LOWER(h.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(h.address) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(h.city) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Hospital> searchHospitals(@Param("keyword") String keyword);
    
    List<Hospital> findByCityAndIsActiveTrue(String city);
    
    @Query("SELECT h FROM Hospital h WHERE h.isActive = true ORDER BY h.rating DESC")
    List<Hospital> findTopRatedHospitals();
}