package com.clinic.booking.controller;

import com.clinic.booking.entity.Payment;
import com.clinic.booking.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Map;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;

    @Value("${vnpay.hash-secret:}")
    private String vnpayHashSecret;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Tạo payment cho appointment
     * POST /api/payments/create/{appointmentId}
     */
    @PostMapping("/create/{appointmentId}")
    public ResponseEntity<Payment> createPayment(@PathVariable Long appointmentId) {
        Payment payment = paymentService.createPaymentForAppointment(appointmentId);
        return ResponseEntity.ok(payment);
    }

    /**
     * Get payment info by code
     * GET /api/payments/{paymentCode}
     */
    @GetMapping("/{paymentCode}")
    public ResponseEntity<Payment> getPayment(@PathVariable String paymentCode) {
        Payment payment = paymentService.getPaymentByCode(paymentCode);
        return ResponseEntity.ok(payment);
    }

    /**
     * Webhook callback từ bank (hoặc manual verify)
     * POST /api/payments/verify
     * Body: { "paymentCode": "APT1234567890", "transactionId": "FT12345678" }
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, String>> verifyPayment(@RequestBody Map<String, String> request) {
        String paymentCode = request.get("paymentCode");
        String transactionId = request.get("transactionId");

        paymentService.verifyPayment(paymentCode, transactionId);

        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Payment verified successfully"
        ));
    }

    /**
     * Check payment status (polling từ frontend)
     * GET /api/payments/{paymentCode}/status
     */
    @GetMapping("/{paymentCode}/status")
    public ResponseEntity<Map<String, Object>> checkPaymentStatus(@PathVariable String paymentCode) {
        Payment payment = paymentService.getPaymentByCode(paymentCode);

        return ResponseEntity.ok(Map.of(
            "paymentCode", payment.getPaymentCode(),
            "status", payment.getStatus(),
            "amount", payment.getAmount(),
            "expiredAt", payment.getExpiredAt(),
            "paidAt", payment.getPaidAt() != null ? payment.getPaidAt() : ""
        ));
    }

    /**
     * Tạo giao dịch VNPAY và trả về URL để redirect
     * POST /api/payments/vnpay/create
     * body: { appointmentId, amount }
     */
    @PostMapping("/vnpay/create")
    public ResponseEntity<Map<String, String>> createVnPayPayment(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        Long appointmentId = Long.valueOf(body.get("appointmentId").toString());
        java.math.BigDecimal amount = new java.math.BigDecimal(body.get("amount").toString());

        Payment payment = paymentService.createVnPayPaymentRecord(appointmentId, amount);
        String clientIp = request.getRemoteAddr();
        String url = paymentService.buildVnPayUrl(payment, clientIp);

        return ResponseEntity.ok(Map.of(
            "paymentUrl", url,
            "txRef", payment.getPaymentCode()
        ));
    }

    /**
     * Tạo giao dịch MOMO và trả về URL để redirect/open
     * POST /api/payments/momo/create
     * body: { appointmentId, amount }
     */
    @PostMapping("/momo/create")
    public ResponseEntity<Map<String, String>> createMomoPayment(@RequestBody Map<String, Object> body) {
        Long appointmentId = Long.valueOf(body.get("appointmentId").toString());
        java.math.BigDecimal amount = new java.math.BigDecimal(body.get("amount").toString());

        Payment payment = paymentService.createMomoPaymentRecord(appointmentId, amount);
        String url = paymentService.buildMomoPayUrl(payment);

        return ResponseEntity.ok(Map.of(
                "paymentUrl", url,
                "txRef", payment.getPaymentCode()
        ));
    }

    /**
     * VNPay redirect return handler
     * GET /api/payments/vnpay/return
     */
    @GetMapping("/vnpay/return")
    public void handleVnPayReturn(HttpServletRequest request, HttpServletResponse response) throws java.io.IOException {
        // Collect params
        Map<String, String[]> params = request.getParameterMap();
        Map<String, String> vnpParams = new java.util.HashMap<>();
        for (Map.Entry<String, String[]> e : params.entrySet()) {
            vnpParams.put(e.getKey(), e.getValue()[0]);
        }

        String vnp_SecureHash = vnpParams.remove("vnp_SecureHash");
        vnpParams.remove("vnp_SecureHashType");

        // Build hash data string
        java.util.SortedMap<String, String> sorted = new java.util.TreeMap<>(vnpParams);
        StringBuilder hashData = new StringBuilder();
        for (Map.Entry<String, String> entry : sorted.entrySet()) {
            if (entry.getKey().startsWith("vnp_")) {
                if (hashData.length() > 0) hashData.append('&');
                hashData.append(entry.getKey()).append('=').append(entry.getValue());
            }
        }

        try {
            String vnpResponseCode = vnpParams.getOrDefault("vnp_ResponseCode", "");
            String txnRef = vnpParams.getOrDefault("vnp_TxnRef", "");
            String txnNo = vnpParams.getOrDefault("vnp_TransactionNo", "");
            String vnpMessage = vnpParams.getOrDefault("vnp_Message", "");

            if ("00".equals(vnpResponseCode)) {
                try {
                    paymentService.verifyPayment(txnRef, txnNo);
                } catch (Exception ex) {
                    // ignore - verification may have been done earlier
                }
                String successUrl = frontendUrl + "/booking/success";
                try {
                    Payment p = paymentService.getPaymentByCode(txnRef);
                    if (p != null && p.getAppointment() != null) {
                        successUrl += "?appointmentId=" + p.getAppointment().getId();
                    }
                } catch (Exception ex) {
                    // ignore
                }
                response.sendRedirect(successUrl);
                return;
            }
            // Failure: redirect to frontend failure page with message and appointmentId (to cancel & release slot)
            String message = (vnpMessage != null && !vnpMessage.isEmpty()) ? vnpMessage : "Thanh toán không thành công hoặc đã bị hủy.";
            String failureUrl = frontendUrl + "/booking/failure?message=" + URLEncoder.encode(message, StandardCharsets.UTF_8);
            try {
                com.clinic.booking.entity.Payment p = paymentService.getPaymentByCode(txnRef);
                if (p != null && p.getAppointment() != null) {
                    failureUrl += "&appointmentId=" + p.getAppointment().getId();
                }
            } catch (Exception ex) {
                // ignore
            }
            response.sendRedirect(failureUrl);
            return;
        } catch (Exception ex) {
            // On any error redirect to failure without params
            try {
                response.sendRedirect(frontendUrl + "/booking/failure?message=" + URLEncoder.encode("Có lỗi xảy ra.", StandardCharsets.UTF_8));
            } catch (Exception e) {
                response.sendRedirect(frontendUrl + "/booking/failure");
            }
        }
    }

    /**
     * MoMo redirect return handler
     * GET /api/payments/momo/return
     *
     * MoMo sẽ redirect về redirectUrl với query params (kèm signature, resultCode, orderId, transId, ...)
     */
    @GetMapping("/momo/return")
    public void handleMomoReturn(HttpServletRequest request, HttpServletResponse response) throws java.io.IOException {
        Map<String, String[]> params = request.getParameterMap();
        Map<String, Object> payload = new java.util.HashMap<>();
        for (Map.Entry<String, String[]> e : params.entrySet()) {
            payload.put(e.getKey(), e.getValue()[0]);
        }

        try {
            String resultCode = payload.getOrDefault("resultCode", "").toString();
            String orderId = payload.getOrDefault("orderId", "").toString();
            String transId = payload.getOrDefault("transId", "").toString();
            String message = payload.getOrDefault("message", "").toString();

            if ("0".equals(resultCode) || "9000".equals(resultCode)) {
                try {
                    paymentService.verifyPayment(orderId, transId);
                } catch (Exception ex) {
                    // ignore - may already have been verified by IPN
                }
                String successUrl = frontendUrl + "/booking/success";
                try {
                    Payment p = paymentService.getPaymentByCode(orderId);
                    if (p != null && p.getAppointment() != null) {
                        successUrl += "?appointmentId=" + p.getAppointment().getId();
                    }
                } catch (Exception ex) {
                    // ignore
                }
                response.sendRedirect(successUrl);
                return;
            }
            // Failure: redirect to frontend failure page with message and appointmentId
            String failMessage = (message != null && !message.isEmpty()) ? message : "Thanh toán không thành công hoặc đã bị hủy.";
            String failureUrl = frontendUrl + "/booking/failure?message=" + URLEncoder.encode(failMessage, StandardCharsets.UTF_8);
            try {
                com.clinic.booking.entity.Payment p = paymentService.getPaymentByCode(orderId);
                if (p != null && p.getAppointment() != null) {
                    failureUrl += "&appointmentId=" + p.getAppointment().getId();
                }
            } catch (Exception ex) {
                // ignore
            }
            response.sendRedirect(failureUrl);
            return;
        } catch (Exception ex) {
            try {
                response.sendRedirect(frontendUrl + "/booking/failure?message=" + URLEncoder.encode("Có lỗi xảy ra.", StandardCharsets.UTF_8));
            } catch (Exception e) {
                response.sendRedirect(frontendUrl + "/booking/failure");
            }
        }
    }

    /**
     * MoMo IPN handler
     * POST /api/payments/momo/ipn
     *
     * IMPORTANT: MoMo recommends responding with HTTP 204 within 15 seconds.
     */
    @PostMapping("/momo/ipn")
    public ResponseEntity<Void> handleMomoIpn(@RequestBody Map<String, Object> body) {
        try {
            String resultCode = body.getOrDefault("resultCode", "").toString();
            String orderId = body.getOrDefault("orderId", "").toString();
            String transId = body.getOrDefault("transId", "").toString();

            if ("0".equals(resultCode) || "9000".equals(resultCode)) {
                try {
                    paymentService.verifyPayment(orderId, transId);
                } catch (Exception ex) {
                    // idempotent
                }
            }
        } catch (Exception ex) {
            // ignore
        }
        return ResponseEntity.noContent().build();
    }

    // local hmac helper in controller
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
}
