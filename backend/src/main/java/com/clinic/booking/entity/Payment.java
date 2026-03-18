package com.clinic.booking.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_code", unique = true, nullable = false, length = 64)
    private String paymentCode; // Mã thanh toán unique (dùng làm nội dung CK)

    @OneToOne
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount; // Số tiền cần thanh toán

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentMethod method = PaymentMethod.BANK_TRANSFER;

    @Column(name = "bank_code", length = 20)
    private String bankCode; // Mã ngân hàng (VCB, TCB, MB...)

    @Column(name = "account_number", length = 50)
    private String accountNumber; // Số tài khoản nhận tiền

    @Column(name = "account_name", length = 255)
    private String accountName; // Tên tài khoản

    @Column(name = "qr_code_url", length = 512)
    private String qrCodeUrl; // URL của QR code

    @Column(name = "transaction_id", length = 100)
    private String transactionId; // Mã giao dịch từ ngân hàng (khi thanh toán thành công)

    @Column(name = "paid_at")
    private LocalDateTime paidAt; // Thời điểm thanh toán

    @Column(name = "expired_at")
    private LocalDateTime expiredAt; // Thời gian hết hạn thanh toán (15 phút)

    @Column(name = "callback_url", length = 512)
    private String callbackUrl; // URL callback sau khi thanh toán

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Enums
    public enum PaymentStatus {
        PENDING,     // Chờ thanh toán
        PROCESSING,  // Đang xử lý
        COMPLETED,   // Đã thanh toán thành công
        FAILED,      // Thất bại
        EXPIRED,     // Hết hạn
        REFUNDED     // Đã hoàn tiền
    }

    public enum PaymentMethod {
        BANK_TRANSFER,  // Chuyển khoản ngân hàng
        MOMO,          // Ví MoMo
        ZALOPAY,       // ZaloPay
        VNPAY,         // VNPay
        CASH           // Tiền mặt
    }
}