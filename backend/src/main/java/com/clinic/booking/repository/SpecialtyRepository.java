package com.clinic.booking.repository;

import com.clinic.booking.entity.Specialty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpecialtyRepository extends JpaRepository<Specialty, Long> {
    
    List<Specialty> findByIsActiveTrue();
    
    Optional<Specialty> findByName(String name);
    
    boolean existsByName(String name);
}