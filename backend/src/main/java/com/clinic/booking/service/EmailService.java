package com.clinic.booking.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    
    private final JavaMailSender mailSender;
    
    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("noreply@clinicbooking.com");
        message.setTo(toEmail);
        message.setSubject("Reset Password OTP - Clinic Booking System");
        message.setText("Your OTP for password reset is: " + otp + "\n\n"
                + "This OTP will expire in 5 minutes.\n\n"
                + "If you did not request this, please ignore this email.");
        
        mailSender.send(message);
    }
    
    public void sendWelcomeEmail(String toEmail, String fullName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("noreply@clinicbooking.com");
        message.setTo(toEmail);
        message.setSubject("Welcome to Clinic Booking System");
        message.setText("Hello " + fullName + ",\n\n"
                + "Welcome to Clinic Booking System!\n\n"
                + "Thank you for registering with us.\n\n"
                + "Best regards,\n"
                + "Clinic Booking Team");
        
        mailSender.send(message);
    }

    public void sendAppointmentBookedEmail(String toEmail, String appointmentCode, String doctorName, String date, String time, String hospitalName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("noreply@clinicbooking.com");
        message.setTo(toEmail);
        message.setSubject("Xác nhận đặt lịch khám - " + appointmentCode);
        message.setText("Xin chào,\n\n" +
                "Bạn đã đặt lịch khám thành công với " + doctorName + " vào " + date + " lúc " + time + ".\n" +
                "Mã lịch hẹn: " + appointmentCode + "\n" +
                "Địa điểm: " + hospitalName + "\n\n" +
                "Cảm ơn bạn đã sử dụng dịch vụ.\n\n" +
                "Clinic Booking Team");
        mailSender.send(message);
    }

    public void sendAppointmentCompletedEmail(String toEmail, String appointmentCode, String doctorName, String date, String time, String hospitalName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("noreply@clinicbooking.com");
        message.setTo(toEmail);
        message.setSubject("Kết thúc khám - " + appointmentCode);
        message.setText("Xin chào,\n\n" +
                "Lịch khám của bạn với " + doctorName + " vào " + date + " lúc " + time + " đã được hoàn tất.\n" +
                "Mã lịch hẹn: " + appointmentCode + "\n" +
                "Địa điểm: " + hospitalName + "\n\n" +
                "Bạn có thể xem hồ sơ khám và đơn thuốc trong tài khoản của mình.\n\n" +
                "Chúc bạn sức khỏe.\n\n" +
                "Clinic Booking Team");
        mailSender.send(message);
    }
}
