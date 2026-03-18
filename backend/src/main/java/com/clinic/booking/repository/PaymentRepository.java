package com.clinic.booking.repository;

import com.clinic.booking.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPaymentCode(String paymentCode);

    Optional<Payment> findByAppointmentId(Long appointmentId);

    List<Payment> findByStatus(Payment.PaymentStatus status);

    List<Payment> findByStatusAndExpiredAtBefore(Payment.PaymentStatus status, LocalDateTime expiredAt);

    Optional<Payment> findByTransactionId(String transactionId);
}