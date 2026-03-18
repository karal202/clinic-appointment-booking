package com.clinic.booking.repository;

import com.clinic.booking.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    
    List<Schedule> findByDoctorIdAndWorkDate(Long doctorId, LocalDate workDate);
    
    List<Schedule> findByDoctorIdAndWorkDateBetween(Long doctorId, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT ds FROM Schedule ds WHERE ds.doctor.id = :doctorId AND " +
           "ds.workDate = :workDate AND ds.isAvailable = true")
    List<Schedule> findAvailableSchedules(@Param("doctorId") Long doctorId, 
                                                @Param("workDate") LocalDate workDate);
    
    @Query("SELECT ds FROM Schedule ds WHERE ds.doctor.id = :doctorId AND " +
           "ds.workDate >= :fromDate AND ds.isAvailable = true AND " +
           "ds.bookedPatients < ds.maxPatients ORDER BY ds.workDate, ds.startTime")
    List<Schedule> findUpcomingAvailableSchedules(@Param("doctorId") Long doctorId,
                                                        @Param("fromDate") LocalDate fromDate);
}