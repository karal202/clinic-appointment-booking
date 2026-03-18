package com.clinic.booking.service;

import com.clinic.booking.entity.Appointment;
import com.clinic.booking.entity.Payment;
import com.clinic.booking.repository.AppointmentRepository;
import com.clinic.booking.repository.PaymentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final AppointmentRepository appointmentRepository;
    private final com.clinic.booking.service.EmailService emailService;

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Value("${payment.bank.code:VCB}")
    private String bankCode;

    @Value("${payment.bank.account-number:1234567890}")
    private String accountNumber;

    @Value("${payment.bank.account-name:PHONG KHAM ABC}")
    private String accountName;

    @Value("${payment.expiry-minutes:15}")
    private int expiryMinutes;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${vnpay.payment-url:}")
    private String vnpayPaymentUrl;

    @Value("${vnpay.tmn-code:}")
    private String vnpayTmnCode;

    @Value("${vnpay.hash-secret:}")
    private String vnpayHashSecret;

    @Value("${vnpay.return-url:}")
    private String vnpayReturnUrl;

    @Value("${momo.endpoint:}")
    private String momoEndpoint;

    @Value("${momo.partner-code:}")
    private String momoPartnerCode;

    @Value("${momo.access-key:}")
    private String momoAccessKey;

    @Value("${momo.secret-key:}")
    private String momoSecretKey;

    @Value("${momo.request-type:captureWallet}")
    private String momoRequestType;

    @Value("${momo.redirect-url:}")
    private String momoRedirectUrl;

    @Value("${momo.ipn-url:}")
    private String momoIpnUrl;

    /**
     * Tạo payment cho appointment và generate QR code
     */
    @Transactional
    public Payment createPaymentForAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Kiểm tra đã có payment chưa
        Payment existingPayment = paymentRepository.findByAppointmentId(appointmentId).orElse(null);
        if (existingPayment != null && existingPayment.getStatus() == Payment.PaymentStatus.COMPLETED) {
            return existingPayment; // Đã thanh toán rồi
        }

        // Tạo payment code unique (dùng làm nội dung chuyển khoản)
        String paymentCode = generatePaymentCode(appointment);

        // Tính số tiền (lấy từ doctor fee)
        BigDecimal amount = appointment.getDoctor().getFeeMin() != null 
            ? appointment.getDoctor().getFeeMin() 
            : BigDecimal.valueOf(200000); // Default 200k

        // Tạo payment record
        Payment payment = new Payment();
        payment.setPaymentCode(paymentCode);
        payment.setAppointment(appointment);
        payment.setAmount(amount);
        payment.setStatus(Payment.PaymentStatus.PENDING);
        payment.setMethod(Payment.PaymentMethod.BANK_TRANSFER);
        payment.setBankCode(bankCode);
        payment.setAccountNumber(accountNumber);
        payment.setAccountName(accountName);
        payment.setExpiredAt(LocalDateTime.now().plusMinutes(expiryMinutes));
        payment.setCallbackUrl(frontendUrl + "/payment-result/" + paymentCode);

        // Generate QR code URL using VietQR API
        String qrCodeUrl = generateVietQRUrl(payment);
        payment.setQrCodeUrl(qrCodeUrl);

        return paymentRepository.save(payment);
    }

    /**
     * Tạo record payment (VNPAY) cho appointment và trả về đối tượng Payment
     */
    @Transactional
    public Payment createVnPayPaymentRecord(Long appointmentId, BigDecimal amount) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Nếu đã có payment pending/processing cho appointment thì trả về luôn
        Payment existing = paymentRepository.findByAppointmentId(appointmentId).orElse(null);
        if (existing != null && existing.getStatus() == Payment.PaymentStatus.PENDING && existing.getMethod() == Payment.PaymentMethod.VNPAY) {
            return existing;
        }

        // Tạo payment code
        String paymentCode = generatePaymentCode(appointment);

        Payment payment = new Payment();
        payment.setPaymentCode(paymentCode);
        payment.setAppointment(appointment);
        payment.setAmount(amount);
        payment.setStatus(Payment.PaymentStatus.PENDING);
        payment.setMethod(Payment.PaymentMethod.VNPAY);
        payment.setExpiredAt(LocalDateTime.now().plusMinutes(expiryMinutes));
        payment.setCallbackUrl(frontendUrl + "/my-bookings");

        return paymentRepository.save(payment);
    }

    // Helper: build VNPay payment URL for a given payment record
    public String buildVnPayUrl(Payment payment, String clientIp) {
        try {
            Map<String, String> vnpParams = new java.util.TreeMap<>();

            vnpParams.put("vnp_Version", "2.1.0");
            vnpParams.put("vnp_Command", "pay");
            vnpParams.put("vnp_TmnCode", vnpayTmnCode);
            vnpParams.put("vnp_Locale", "vn");
            vnpParams.put("vnp_CurrCode", "VND");
            vnpParams.put("vnp_TxnRef", payment.getPaymentCode());
            vnpParams.put("vnp_OrderInfo", "Thanh toán lịch hẹn " + payment.getPaymentCode());
            vnpParams.put("vnp_OrderType", "other");
            vnpParams.put("vnp_Amount", String.valueOf(payment.getAmount().multiply(new java.math.BigDecimal(100)).longValue()));
            vnpParams.put("vnp_ReturnUrl", vnpayReturnUrl);
            vnpParams.put("vnp_CreateDate", java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
            if (clientIp != null && !clientIp.isEmpty()) vnpParams.put("vnp_IpAddr", clientIp);

            // Build hash data
            StringBuilder hashData = new StringBuilder();
            StringBuilder query = new StringBuilder();
            for (Map.Entry<String, String> entry : vnpParams.entrySet()) {
                if (hashData.length() > 0) {
                    hashData.append('&');
                    query.append('&');
                }
                hashData.append(entry.getKey()).append('=').append(entry.getValue());
                query.append(entry.getKey()).append('=').append(java.net.URLEncoder.encode(entry.getValue(), java.nio.charset.StandardCharsets.US_ASCII.toString()));
            }

            String secureHash = hmacSHA512(vnpayHashSecret, hashData.toString());
            String paymentUrl = vnpayPaymentUrl + "?" + query.toString() + "&vnp_SecureHash=" + secureHash;
            return paymentUrl;
        } catch (Exception ex) {
            throw new RuntimeException("Error building VNPay URL", ex);
        }
    }

    /**
     * Tạo record payment (MOMO) cho appointment và trả về đối tượng Payment
     */
    @Transactional
    public Payment createMomoPaymentRecord(Long appointmentId, BigDecimal amount) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // If there is an existing payment record, prefer reusing/updating it if not completed.
        Payment existing = paymentRepository.findByAppointmentId(appointmentId).orElse(null);
        if (existing != null) {
            if (existing.getStatus() == Payment.PaymentStatus.COMPLETED) {
                return existing;
            }
            // Reuse the same record but ensure method is MOMO and refresh code/amount/expiry
            existing.setMethod(Payment.PaymentMethod.MOMO);
            existing.setAmount(amount);
            existing.setStatus(Payment.PaymentStatus.PENDING);
            existing.setExpiredAt(LocalDateTime.now().plusMinutes(expiryMinutes));
            existing.setCallbackUrl(frontendUrl + "/my-bookings");
            // Regenerate paymentCode to avoid reusing an old orderId
            existing.setPaymentCode(generatePaymentCode(appointment));
            existing.setTransactionId(null);
            existing.setPaidAt(null);
            existing.setNotes(null);
            existing.setQrCodeUrl(null);
            return paymentRepository.save(existing);
        }

        String paymentCode = generatePaymentCode(appointment);

        Payment payment = new Payment();
        payment.setPaymentCode(paymentCode);
        payment.setAppointment(appointment);
        payment.setAmount(amount);
        payment.setStatus(Payment.PaymentStatus.PENDING);
        payment.setMethod(Payment.PaymentMethod.MOMO);
        payment.setExpiredAt(LocalDateTime.now().plusMinutes(expiryMinutes));
        payment.setCallbackUrl(frontendUrl + "/my-bookings");
        return paymentRepository.save(payment);
    }

    /**
     * Call MoMo create API and return payUrl for redirect/open in browser.
     * Also stores qrCodeUrl (if returned) in Payment record for reference.
     */
    @Transactional
    public String buildMomoPayUrl(Payment payment) {
        // Validate config early (avoid confusing 500)
        if (isBlank(momoEndpoint) || isBlank(momoPartnerCode) || isBlank(momoAccessKey) || isBlank(momoSecretKey)
                || isBlank(momoRedirectUrl) || isBlank(momoIpnUrl)) {
            throw new RuntimeException("Missing MoMo configuration. Please set momo.endpoint, momo.partner-code, momo.access-key, momo.secret-key, momo.redirect-url, momo.ipn-url");
        }

        try {
            String orderId = payment.getPaymentCode();
            String requestId = "REQ" + System.currentTimeMillis();
            long amount = payment.getAmount() != null ? payment.getAmount().longValue() : 0L;

            // MoMo yêu cầu amount từ 10,000 đến 50,000,000 VND
            if (amount < 10_000L) {
                amount = 10_000L;
            } else if (amount > 50_000_000L) {
                amount = 50_000_000L;
            }

            String orderInfo = "Thanh toán lịch hẹn " + orderId;
            String extraData = ""; // keep empty; partner can base64 JSON here if needed

            // Raw signature: build from key-value pairs (sorted by key) => HMAC_SHA256(secretKey, raw)
            java.util.Map<String, String> signatureParams = new java.util.TreeMap<>();
            signatureParams.put("accessKey", momoAccessKey);
            signatureParams.put("amount", String.valueOf(amount));
            signatureParams.put("extraData", extraData);
            signatureParams.put("ipnUrl", momoIpnUrl);
            signatureParams.put("orderId", orderId);
            signatureParams.put("orderInfo", orderInfo);
            signatureParams.put("partnerCode", momoPartnerCode);
            signatureParams.put("redirectUrl", momoRedirectUrl);
            signatureParams.put("requestId", requestId);
            signatureParams.put("requestType", momoRequestType);

            String rawSignature = joinAsRawSignature(signatureParams);
            String signature = hmacSHA256(momoSecretKey, rawSignature);

            java.util.Map<String, Object> body = new java.util.LinkedHashMap<>();
            body.put("partnerCode", momoPartnerCode);
            body.put("accessKey", momoAccessKey);
            body.put("requestId", requestId);
            body.put("amount", amount);
            body.put("orderId", orderId);
            body.put("orderInfo", orderInfo);
            body.put("redirectUrl", momoRedirectUrl);
            body.put("ipnUrl", momoIpnUrl);
            body.put("requestType", momoRequestType);
            body.put("extraData", extraData);
            body.put("lang", "vi");
            body.put("signature", signature);

            String jsonBody = OBJECT_MAPPER.writeValueAsString(body);

            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(momoEndpoint))
                    .header("Content-Type", "application/json")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            java.net.http.HttpResponse<String> resp = client.send(req, java.net.http.HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
                throw new RuntimeException("MoMo create failed (HTTP " + resp.statusCode() + "): " + resp.body());
            }

            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> result = OBJECT_MAPPER.readValue(resp.body(), java.util.Map.class);
            Object rc = result.get("resultCode");
            int resultCode = rc != null ? Integer.parseInt(rc.toString()) : -1;
            String message = result.get("message") != null ? result.get("message").toString() : "";
            if (resultCode != 0 && resultCode != 9000) {
                throw new RuntimeException("MoMo create failed: resultCode=" + resultCode + ", message=" + message);
            }

            String payUrl = result.get("payUrl") != null ? result.get("payUrl").toString() : null;
            String qrCodeUrl = result.get("qrCodeUrl") != null ? result.get("qrCodeUrl").toString() : null;

            // Store some references for debugging/audit
            payment.setNotes("momo_requestId=" + requestId);
            if (qrCodeUrl != null && !qrCodeUrl.isBlank()) payment.setQrCodeUrl(qrCodeUrl);
            paymentRepository.save(payment);

            if (payUrl == null || payUrl.isBlank()) {
                throw new RuntimeException("MoMo response missing payUrl");
            }
            return payUrl;
        } catch (RuntimeException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new RuntimeException("Error creating MoMo payment", ex);
        }
    }

    // HMAC SHA512 helper
    private String hmacSHA512(String key, String data) throws Exception {
        javax.crypto.Mac sha512_HMAC = javax.crypto.Mac.getInstance("HmacSHA512");
        javax.crypto.spec.SecretKeySpec secret_key = new javax.crypto.spec.SecretKeySpec(key.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA512");
        sha512_HMAC.init(secret_key);
        byte[] bytes = sha512_HMAC.doFinal(data.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        StringBuilder hash = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(b & 0xff);
            if (hex.length() == 1) hash.append('0');
            hash.append(hex);
        }
        return hash.toString();
    }

    // HMAC SHA256 helper (MoMo)
    public String hmacSHA256(String key, String data) throws Exception {
        javax.crypto.Mac sha256_HMAC = javax.crypto.Mac.getInstance("HmacSHA256");
        javax.crypto.spec.SecretKeySpec secret_key = new javax.crypto.spec.SecretKeySpec(key.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256");
        sha256_HMAC.init(secret_key);
        byte[] bytes = sha256_HMAC.doFinal(data.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        StringBuilder hash = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(b & 0xff);
            if (hex.length() == 1) hash.append('0');
            hash.append(hex);
        }
        return hash.toString();
    }

    public boolean verifyMomoSignature(java.util.Map<String, Object> payload) {
        if (payload == null) return false;
        Object sigObj = payload.get("signature");
        if (sigObj == null) return false;
        String provided = sigObj.toString();

        try {
            // Theo tài liệu MoMo, rawSignature cho IPN/redirect có dạng:
            // accessKey=$accessKey&amount=$amount&extraData=$extraData&message=$message&
            // orderId=$orderId&orderInfo=$orderInfo&orderType=$orderType&partnerCode=$partnerCode&
            // payType=$payType&requestId=$requestId&responseTime=$responseTime&
            // resultCode=$resultCode&transId=$transId
            String raw = "accessKey=" + momoAccessKey
                    + "&amount=" + getMomoField(payload, "amount")
                    + "&extraData=" + getMomoField(payload, "extraData")
                    + "&message=" + getMomoField(payload, "message")
                    + "&orderId=" + getMomoField(payload, "orderId")
                    + "&orderInfo=" + getMomoField(payload, "orderInfo")
                    + "&orderType=" + getMomoField(payload, "orderType")
                    + "&partnerCode=" + getMomoField(payload, "partnerCode")
                    + "&payType=" + getMomoField(payload, "payType")
                    + "&requestId=" + getMomoField(payload, "requestId")
                    + "&responseTime=" + getMomoField(payload, "responseTime")
                    + "&resultCode=" + getMomoField(payload, "resultCode")
                    + "&transId=" + getMomoField(payload, "transId");

            String calc = hmacSHA256(momoSecretKey, raw);
            return calc.equalsIgnoreCase(provided);
        } catch (Exception ex) {
            return false;
        }
    }

    /**
     * Generate payment code unique
     * Format: APT-{appointmentCode}-{timestamp}
     */
    private String generatePaymentCode(Appointment appointment) {
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(8);
        return String.format("APT%s%s", 
            appointment.getAppointmentCode().replace("APP-", "").substring(0, 4),
            timestamp
        );
    }

    /**
     * Generate VietQR URL
     * API: https://img.vietqr.io/image/{BANK_CODE}-{ACCOUNT_NO}-{TEMPLATE}.jpg?amount={AMOUNT}&addInfo={CONTENT}&accountName={NAME}
     */
    private String generateVietQRUrl(Payment payment) {
        String template = "compact2"; // hoặc "compact", "qr_only", "print"
        
        return String.format(
            "https://img.vietqr.io/image/%s-%s-%s.jpg?amount=%s&addInfo=%s&accountName=%s",
            payment.getBankCode(),
            payment.getAccountNumber(),
            template,
            payment.getAmount().intValue(),
            payment.getPaymentCode(),
            payment.getAccountName().replace(" ", "%20")
        );
    }

    /**
     * Webhook callback từ bank hoặc cron job check payment status
     */
    @Transactional
    public void verifyPayment(String paymentCode, String transactionId) {
        Payment payment = paymentRepository.findByPaymentCode(paymentCode)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (payment.getStatus() == Payment.PaymentStatus.COMPLETED) {
            return; // Đã xử lý rồi
        }

        // Update payment status
        payment.setStatus(Payment.PaymentStatus.COMPLETED);
        payment.setTransactionId(transactionId);
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // Update appointment payment status
        Appointment appointment = payment.getAppointment();
        appointment.setPaymentStatus(Appointment.PaymentStatus.PAID);
        appointment.setStatus(Appointment.AppointmentStatus.CONFIRMED);
        appointmentRepository.save(appointment);

        // Send booking email now that payment is verified (best-effort)
        try {
            String userEmail = appointment.getUser() != null ? appointment.getUser().getEmail() : null;
            if (userEmail != null && !userEmail.endsWith("@temp.com")) {
                emailService.sendAppointmentBookedEmail(
                    userEmail,
                    appointment.getAppointmentCode(),
                    appointment.getDoctor() != null ? appointment.getDoctor().getFullName() : "",
                    appointment.getAppointmentDate() != null ? appointment.getAppointmentDate().toString() : "",
                    appointment.getAppointmentTime() != null ? appointment.getAppointmentTime().toString() : "",
                    appointment.getHospital() != null ? appointment.getHospital().getName() : ""
                );
            }
        } catch (Exception ex) {
            // best-effort
            System.err.println("Failed to send post-payment email: " + ex.getMessage());
        }
    }

    /**
     * Check expired payments và auto cancel
     */
    @Transactional
    public void checkExpiredPayments() {
        LocalDateTime now = LocalDateTime.now();
        paymentRepository.findByStatusAndExpiredAtBefore(Payment.PaymentStatus.PENDING, now)
                .forEach(payment -> {
                    payment.setStatus(Payment.PaymentStatus.EXPIRED);
                    paymentRepository.save(payment);

                    // Optional: Cancel appointment
                    Appointment appointment = payment.getAppointment();
                    if (appointment.getStatus() == Appointment.AppointmentStatus.PENDING) {
                        appointment.setStatus(Appointment.AppointmentStatus.CANCELLED);
                        appointment.setCancelReason("Hết hạn thanh toán");
                        appointmentRepository.save(appointment);
                    }
                });
    }

    /**
     * Get payment by code
     */
    public Payment getPaymentByCode(String paymentCode) {
        return paymentRepository.findByPaymentCode(paymentCode)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
    }

    private String getMomoField(java.util.Map<String, Object> payload, String key) {
        Object v = payload.get(key);
        return v != null ? v.toString() : "";
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private String joinAsRawSignature(java.util.Map<String, String> sortedParams) {
        StringBuilder sb = new StringBuilder();
        for (java.util.Map.Entry<String, String> e : sortedParams.entrySet()) {
            if (sb.length() > 0) sb.append('&');
            sb.append(e.getKey()).append('=').append(e.getValue());
        }
        return sb.toString();
    }
}