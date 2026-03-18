package com.clinic.booking.repository;

import com.clinic.booking.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

       Optional<Appointment> findByAppointmentCode(String appointmentCode);

       List<Appointment> findByUserIdOrderByAppointmentDateDescAppointmentTimeDesc(Long userId);

       List<Appointment> findByDoctorIdOrderByAppointmentDateDescAppointmentTimeDesc(Long doctorId);

       List<Appointment> findByHospitalIdOrderByAppointmentDateDescAppointmentTimeDesc(Long hospitalId);

       @Query("SELECT a FROM Appointment a WHERE a.user.id = :userId AND a.status = :status " +
                     "ORDER BY a.appointmentDate DESC, a.appointmentTime DESC")
       List<Appointment> findByUserIdAndStatus(@Param("userId") Long userId,
                     @Param("status") Appointment.AppointmentStatus status);

       @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId AND " +
                     "a.appointmentDate = :date ORDER BY a.appointmentTime")
       List<Appointment> findByDoctorAndDate(@Param("doctorId") Long doctorId,
                     @Param("date") LocalDate date);

       @Query("SELECT a FROM Appointment a WHERE a.appointmentDate BETWEEN :startDate AND :endDate " +
                     "AND a.status IN :statuses ORDER BY a.appointmentDate, a.appointmentTime")
       List<Appointment> findByDateRangeAndStatuses(@Param("startDate") LocalDate startDate,
                     @Param("endDate") LocalDate endDate,
                     @Param("statuses") List<Appointment.AppointmentStatus> statuses);

       boolean existsByAppointmentCode(String appointmentCode);

       @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctor.id = :doctorId AND " +
                     "a.appointmentDate = :date AND a.status != 'CANCELLED'")
       Long countByDoctorAndDate(@Param("doctorId") Long doctorId, @Param("date") LocalDate date);

       @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctor.id = :doctorId AND " +
                     "a.appointmentDate = :date AND a.status = :status")
       Long countByDoctorAndDateAndStatus(@Param("doctorId") Long doctorId,
                     @Param("date") LocalDate date,
                     @Param("status") Appointment.AppointmentStatus status);

       @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctor.id = :doctorId AND " +
                     "a.schedule.startTime = :start AND a.status != 'CANCELLED'")
       Long countByDoctorAndScheduleStartTime(@Param("doctorId") Long doctorId, @Param("start") LocalDateTime start);

       @Query("SELECT COUNT(a) FROM Appointment a WHERE a.paymentStatus = com.clinic.booking.entity.Appointment.PaymentStatus.PAID AND a.appointmentDate BETWEEN :startDate AND :endDate")
       Long countPaidAppointmentsBetween(@Param("startDate") java.time.LocalDate startDate,
                     @Param("endDate") java.time.LocalDate endDate);

       @Query("SELECT COALESCE(SUM(a.doctor.feeMin), 0) FROM Appointment a WHERE a.paymentStatus = com.clinic.booking.entity.Appointment.PaymentStatus.PAID AND a.appointmentDate BETWEEN :startDate AND :endDate")
       java.math.BigDecimal sumRevenueFromPaidAppointmentsBetween(@Param("startDate") java.time.LocalDate startDate,
                     @Param("endDate") java.time.LocalDate endDate);

       @Query("SELECT MAX(a.queueNumber) FROM Appointment a WHERE a.doctor.id = :doctorId AND " +
                     "a.appointmentDate = :date")
       Integer findMaxQueueNumber(@Param("doctorId") Long doctorId, @Param("date") java.time.LocalDate date);

       boolean existsByUserIdAndDoctorIdAndAppointmentDateAndStatusNotIn(Long userId, Long doctorId,
                     LocalDate appointmentDate, List<Appointment.AppointmentStatus> statuses);

       boolean existsByUserIdAndAppointmentDateAndAppointmentTimeAndStatusNotIn(Long userId, LocalDate appointmentDate,
                     LocalTime appointmentTime, List<Appointment.AppointmentStatus> statuses);

       boolean existsByPatientPhoneAndAppointmentDateAndAppointmentTimeAndStatusNotIn(String patientPhone,
                     LocalDate appointmentDate, LocalTime appointmentTime,
                     List<Appointment.AppointmentStatus> statuses);

       boolean existsByPatientPhoneAndDoctorIdAndAppointmentDateAndStatusNotIn(String patientPhone, Long doctorId,
                     LocalDate appointmentDate, List<Appointment.AppointmentStatus> statuses);
}