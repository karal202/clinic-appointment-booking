package com.clinic.booking.service;

import com.clinic.booking.dto.*;
import com.clinic.booking.entity.*;
import com.clinic.booking.exception.ResourceNotFoundException;
import com.clinic.booking.repository.AppointmentRepository;
import com.clinic.booking.repository.DoctorRepository;
import com.clinic.booking.repository.NotificationRepository;
import com.clinic.booking.repository.ScheduleRepository;
import com.clinic.booking.repository.SlotLockRepository;
import com.clinic.booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final ScheduleRepository scheduleRepository;
    private final NotificationRepository notificationRepository;
    private final SlotLockRepository slotLockRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder; // ADD THIS

    public List<AppointmentDTO> getMyAppointments(Long userId) {
        return appointmentRepository.findByUserIdOrderByAppointmentDateDescAppointmentTimeDesc(userId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AppointmentDTO createAppointment(Long userId, AppointmentRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        Schedule schedule = scheduleRepository.findById(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Schedule slot not found"));

        LocalDateTime now = LocalDateTime.now();

        // Xác định số điện thoại bệnh nhân (Ưu tiên từ request, nếu không có dùng của
        // User)
        String effectivePhone = (request.getPatientPhone() != null && !request.getPatientPhone().isBlank())
                ? request.getPatientPhone().trim()
                : user.getPhoneNumber();

        // Ràng buộc: Không đặt lịch trong quá khứ
        if (request.getAppointmentDate().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể đặt lịch cho ngày trong quá khứ.");
        }
        if (request.getAppointmentDate().isEqual(LocalDate.now())
                && request.getAppointmentTime().isBefore(now.toLocalTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khung giờ này đã trôi qua.");
        }

        // Ràng buộc 1: Một người (theo SĐT) không thể đặt 2 lịch hẹn trùng giờ (dù khác
        // bác sĩ)
        boolean hasConflictTime = appointmentRepository
                .existsByPatientPhoneAndAppointmentDateAndAppointmentTimeAndStatusNotIn(
                        effectivePhone, request.getAppointmentDate(), request.getAppointmentTime(),
                        List.of(Appointment.AppointmentStatus.CANCELLED));
        if (hasConflictTime) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Bệnh nhân này đã có một lịch hẹn khác vào khung giờ này.");
        }

        // Ràng buộc 2: Một người (theo SĐT) không được đặt 2 lịch với cùng 1 bác sĩ
        // trong cùng 1 ngày
        boolean hasDuplicateDoctor = appointmentRepository
                .existsByPatientPhoneAndDoctorIdAndAppointmentDateAndStatusNotIn(
                        effectivePhone, request.getDoctorId(), request.getAppointmentDate(),
                        List.of(Appointment.AppointmentStatus.CANCELLED));
        if (hasDuplicateDoctor) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Bệnh nhân này đã đặt lịch với bác sĩ này trong ngày hôm nay rồi.");
        }

        if (!schedule.getIsAvailable()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Khung giờ này hiện không phục vụ");
        }

        // Đếm số đã đặt + số lock đang hoạt động
        long bookedCount = appointmentRepository.countByDoctorAndScheduleStartTime(
                doctor.getId(), schedule.getStartTime());
        long activeLocks = slotLockRepository.countByScheduleIdAndExpireAtAfter(schedule.getId(), now);

        // Kiểm tra user hiện tại có giữ lock hay không
        boolean userHasLock = slotLockRepository.existsByScheduleIdAndUserIdAndExpireAtAfter(
                schedule.getId(), userId, now);

        // Nếu đã đầy
        if (bookedCount + activeLocks >= schedule.getMaxPatients()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Rất tiếc, khung giờ này đã hết chỗ. Vui lòng chọn khung giờ khác.");
        }

        // Nếu có lock của người khác và user hiện tại không giữ lock
        if (!userHasLock && activeLocks > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Khung giờ đang được giữ bởi người khác. Vui lòng giữ chỗ trước khi hoàn tất đặt lịch.");
        }

        // Generate appointment code
        String code = "APP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Appointment appointment = new Appointment();
        appointment.setAppointmentCode(code);
        appointment.setUser(user);
        appointment.setDoctor(doctor);
        appointment.setSchedule(schedule);
        appointment.setHospital(doctor.getHospital());
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setAppointmentTime(request.getAppointmentTime());
        appointment.setStatus(Appointment.AppointmentStatus.PENDING);
        appointment.setPaymentStatus(Appointment.PaymentStatus.UNPAID);
        appointment.setSymptomsNote(request.getSymptomsNote());
        appointment.setHospital(schedule.getDoctor().getHospital());

        // Save patient snapshot provided at booking (allows booking for third-party /
        // editable at checkout)
        // Lưu thông tin bệnh nhân (lấy từ request hoặc mặc định từ User)
        appointment.setPatientName((request.getPatientName() != null && !request.getPatientName().isBlank())
                ? request.getPatientName().trim()
                : user.getFullName());
        appointment.setPatientPhone((request.getPatientPhone() != null && !request.getPatientPhone().isBlank())
                ? request.getPatientPhone().trim()
                : user.getPhoneNumber());

        if (request.getPatientAddress() != null && !request.getPatientAddress().isBlank())
            appointment.setPatientAddress(request.getPatientAddress().trim());
        else
            appointment.setPatientAddress(user.getAddress());

        Appointment saved = appointmentRepository.save(appointment);

        // Xóa lock tạm thời sau khi đã đặt lịch thành công
        slotLockRepository.deleteByUserId(userId);

        // Gửi tín hiệu cập nhật realtime qua WebSocket
        messagingTemplate.convertAndSend("/topic/slots", schedule.getId());

        // Create notification
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setKind(Notification.NotificationKind.booked);
        notification.setAppointment(saved);
        notification.setMessage("Bạn đã đặt lịch khám thành công với " + doctor.getFullName());
        notificationRepository.save(notification);

        // Send email to user (best-effort) after booking
        try {
            String userEmail = user.getEmail();
            String pm = request.getPaymentMethod();
            String pmNorm = pm != null ? pm.trim() : "";
            boolean isOnlinePay = "VNPAY".equalsIgnoreCase(pmNorm) || "MOMO".equalsIgnoreCase(pmNorm);

            // If user chose online payment (VNPay / MoMo), DO NOT send booking email now —
            // wait until payment verification.
            if (!isOnlinePay && userEmail != null && !userEmail.endsWith("@temp.com")) {
                emailService.sendAppointmentBookedEmail(
                        userEmail,
                        saved.getAppointmentCode(),
                        doctor.getFullName(),
                        saved.getAppointmentDate().toString(),
                        saved.getAppointmentTime().toString(),
                        saved.getHospital() != null ? saved.getHospital().getName() : "");
            }
        } catch (Exception ex) {
            // best-effort: don't fail booking when email fails
            System.err.println("Failed to send appointment email: " + ex.getMessage());
        }

        return mapToDTO(appointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO> getDoctorAppointments(Long doctorId) {
        return appointmentRepository.findByDoctorIdOrderByAppointmentDateDescAppointmentTimeDesc(doctorId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AppointmentDTO getAppointmentByCode(String appointmentCode) {
        Appointment a = appointmentRepository.findByAppointmentCode(appointmentCode)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        return mapToDTO(a);
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO> getAllAppointments() {
        return appointmentRepository.findAll().stream()
                .sorted((a, b) -> {
                    int res = b.getAppointmentDate().compareTo(a.getAppointmentDate());
                    if (res == 0)
                        return b.getAppointmentTime().compareTo(a.getAppointmentTime());
                    return res;
                })
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO> getHospitalAppointments(Long hospitalId) {
        return appointmentRepository.findByHospitalIdOrderByAppointmentDateDescAppointmentTimeDesc(hospitalId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AppointmentDTO updateAppointmentStatus(Long appointmentId, Appointment.AppointmentStatus status) {
        Appointment a = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        // Ràng buộc: Không thể thay đổi trạng thái của lịch hẹn đã hủy hoặc đã hoàn
        // thành/no-show
        if (a.getStatus() == Appointment.AppointmentStatus.CANCELLED ||
                a.getStatus() == Appointment.AppointmentStatus.COMPLETED ||
                a.getStatus() == Appointment.AppointmentStatus.NO_SHOW) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Không thể thay đổi trạng thái của lịch hẹn đã kết thúc hoặc đã hủy.");
        }

        // Ràng buộc: Bác sĩ không thể xác nhận check-in (chỉ Staff/Admin)
        if (status == Appointment.AppointmentStatus.CHECKED_IN) {
            String currentUserEmail = org.springframework.security.core.context.SecurityContextHolder.getContext()
                    .getAuthentication().getName();
            User currentUser = userRepository.findByEmail(currentUserEmail).orElseThrow();
            if (currentUser.getRole() == User.Role.DOCTOR) {
                throw new RuntimeException(
                        "Bác sĩ không có quyền xác nhận Check-in. Vui lòng liên hệ bộ phận Tiếp tân.");
            }
            return checkIn(appointmentId);
        }

        a.setStatus(status);
        return mapToDTO(appointmentRepository.save(a));
    }

    @Transactional
    public AppointmentDTO assignRoom(Long appointmentId, String roomName) {
        Appointment a = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        a.setAssignedRoom(roomName);
        Appointment saved = appointmentRepository.save(a);
        // Realtime: notify about appointment update (assigned room)
        try {
            messagingTemplate.convertAndSend("/topic/appointments", mapToDTO(saved));
        } catch (Exception ex) {
            // best-effort
        }
        return mapToDTO(saved);
    }

    @Transactional
    public AppointmentDTO checkIn(Long appointmentId) {
        Appointment a = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (a.getStatus() == Appointment.AppointmentStatus.CHECKED_IN) {
            return mapToDTO(a);
        }

        // Tạo số thứ tự (STT) dựa trên số lớn nhất hiện tại trong ngày của bác sĩ đó
        Integer maxSTT = appointmentRepository.findMaxQueueNumber(a.getDoctor().getId(), a.getAppointmentDate());
        int nextSTT = (maxSTT == null) ? 1 : maxSTT + 1;

        a.setQueueNumber(nextSTT);
        a.setStatus(Appointment.AppointmentStatus.CHECKED_IN);

        // Tự động gán phòng nếu bác sĩ đã có phòng trực
        if (a.getDoctor().getWorkingRoom() != null && !a.getDoctor().getWorkingRoom().isEmpty()) {
            a.setAssignedRoom(a.getDoctor().getWorkingRoom());
        }

        return mapToDTO(appointmentRepository.save(a));
    }

    @Transactional
    public AppointmentDTO createWalkInAppointment(WalkInRequest request) {
        System.out.println("========== START createWalkInAppointment ==========");
        System.out.println("Request received: " + request);

        // Validate inputs early to avoid 500 and return clear 400 to client
        if (request == null) {
            System.err.println("ERROR: Request is null");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing request body");
        }

        System.out.println("Request details:");
        System.out.println("  - fullName: " + request.getFullName());
        System.out.println("  - phoneNumber: " + request.getPhoneNumber());
        System.out.println("  - gender: " + request.getGender());
        System.out.println("  - doctorId: " + request.getDoctorId());
        System.out.println("  - symptomsNote: " + request.getSymptomsNote());

        if (request.getDoctorId() == null) {
            System.err.println("ERROR: doctorId is null");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "doctorId is required");
        }
        if (request.getPhoneNumber() == null || request.getPhoneNumber().isBlank()) {
            System.err.println("ERROR: phoneNumber is null or blank");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "phoneNumber is required");
        }
        if (request.getFullName() == null || request.getFullName().isBlank()) {
            System.err.println("ERROR: fullName is null or blank");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fullName is required");
        }

        System.out.println("Validation passed. Looking up doctor with ID: " + request.getDoctorId());
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> {
                    System.err.println("ERROR: Doctor not found with ID: " + request.getDoctorId());
                    return new ResourceNotFoundException("Doctor not found");
                });

        System.out.println("Doctor found: " + doctor.getFullName());
        System.out.println("Looking up user by phone number: " + request.getPhoneNumber());

        // FIXED: Tìm hoặc tạo User - kiểm tra cả phone và email
        User user;
        Optional<User> existingUser = userRepository.findByPhoneNumber(request.getPhoneNumber());

        if (existingUser.isPresent()) {
            System.out.println("User found by phone number: " + existingUser.get().getFullName());
            user = existingUser.get();

            // Update user info if needed
            if (!user.getFullName().equals(request.getFullName())) {
                System.out.println(
                        "Updating user fullName from '" + user.getFullName() + "' to '" + request.getFullName() + "'");
                user.setFullName(request.getFullName());
            }
            if (request.getGender() != null && !request.getGender().equals(user.getGender())) {
                System.out.println("Updating user gender to: " + request.getGender());
                user.setGender(request.getGender());
            }

            user = userRepository.save(user);
            System.out.println("User info updated");
        } else {
            // Check if email already exists (in case phone number changed)
            String tempEmail = request.getPhoneNumber() + "@temp.com";
            Optional<User> existingByEmail = userRepository.findByEmail(tempEmail);

            if (existingByEmail.isPresent()) {
                System.out.println("User found by email: " + existingByEmail.get().getFullName());
                user = existingByEmail.get();

                // Update phone number
                System.out.println("Updating user phone number to: " + request.getPhoneNumber());
                user.setPhoneNumber(request.getPhoneNumber());
                user.setFullName(request.getFullName());
                if (request.getGender() != null) {
                    user.setGender(request.getGender());
                }

                user = userRepository.save(user);
                System.out.println("User info updated");
            } else {
                // Create new user
                System.out.println("User not found. Creating new user...");
                User newUser = new User();
                newUser.setFullName(request.getFullName());
                newUser.setPhoneNumber(request.getPhoneNumber());

                String gender = request.getGender() != null ? request.getGender() : "MALE";
                System.out.println("Setting gender: " + gender);
                newUser.setGender(gender);

                System.out.println("Setting email: " + tempEmail);
                newUser.setEmail(tempEmail);

                System.out.println("Encoding password...");
                try {
                    String encodedPassword = passwordEncoder.encode("walkin123");
                    newUser.setPassword(encodedPassword);
                    System.out.println("Password encoded successfully");
                } catch (Exception e) {
                    System.err.println("ERROR encoding password: " + e.getMessage());
                    e.printStackTrace();
                    throw e;
                }

                // Set all required fields with defaults
                newUser.setRole(User.Role.USER);
                newUser.setAuthProvider(User.AuthProvider.LOCAL);
                newUser.setIsActive(true);
                newUser.setEmailVerified(false);
                newUser.setDeleted(false);

                System.out.println("All required fields set. Saving new user...");
                try {
                    user = userRepository.save(newUser);
                    System.out.println("New user saved successfully with ID: " + user.getId());
                } catch (Exception e) {
                    System.err.println("ERROR saving user: " + e.getMessage());
                    System.err.println("ERROR cause: " + (e.getCause() != null ? e.getCause().getMessage() : "None"));
                    e.printStackTrace();
                    throw e;
                }
            }
        }

        System.out.println("User obtained: " + user.getFullName() + " (ID: " + user.getId() + ")");
        LocalDate today = LocalDate.now();
        System.out.println("Creating appointment for date: " + today);

        // Tạo lịch hẹn trực tiếp (Check-in ngay)
        Appointment a = new Appointment();
        String appointmentCode = "WALKIN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        System.out.println("Generated appointment code: " + appointmentCode);

        a.setAppointmentCode(appointmentCode);
        a.setUser(user);
        a.setDoctor(doctor);
        a.setHospital(doctor.getHospital());
        a.setAppointmentDate(today);
        a.setAppointmentTime(java.time.LocalTime.now());
        a.setStatus(Appointment.AppointmentStatus.CHECKED_IN);
        a.setPaymentStatus(Appointment.PaymentStatus.PAID);
        a.setSymptomsNote(request.getSymptomsNote());

        // Set patient info from request
        a.setPatientName(request.getFullName());
        a.setPatientPhone(request.getPhoneNumber());

        // Tự động gán phòng của bác sĩ
        if (doctor.getWorkingRoom() != null) {
            System.out.println("Assigning room: " + doctor.getWorkingRoom());
            a.setAssignedRoom(doctor.getWorkingRoom());
        } else {
            System.out.println("No working room assigned to doctor");
        }

        // Gán STT
        System.out.println("Getting max queue number for doctor...");
        Integer maxSTT = appointmentRepository.findMaxQueueNumber(doctor.getId(), today);
        int queueNumber = (maxSTT == null) ? 1 : maxSTT + 1;
        System.out.println("Queue number assigned: " + queueNumber);
        a.setQueueNumber(queueNumber);

        System.out.println("Saving appointment...");
        try {
            Appointment savedAppointment = appointmentRepository.save(a);
            System.out.println("Appointment saved successfully with ID: " + savedAppointment.getId());
            AppointmentDTO dto = mapToDTO(savedAppointment);
            System.out.println("========== END createWalkInAppointment SUCCESS ==========");
            return dto;
        } catch (Exception e) {
            System.err.println("ERROR saving appointment: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Transactional
    public AppointmentDTO confirmPayment(Long appointmentId) {
        Appointment a = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        a.setPaymentStatus(Appointment.PaymentStatus.PAID);
        a.setStatus(Appointment.AppointmentStatus.CONFIRMED);

        Appointment saved = appointmentRepository.save(a);

        // Realtime: notify staff/clients about payment/status change
        try {
            messagingTemplate.convertAndSend("/topic/appointments", mapToDTO(saved));
        } catch (Exception ex) {
            // best-effort: do not fail when websocket notification fails
        }

        return mapToDTO(saved);
    }

    @Transactional
    public void cancelAppointment(Long appointmentId, Long userId) {
        Appointment a = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        // Ràng buộc: Không được hủy nếu đã Check-in trở đi
        if (a.getStatus() != Appointment.AppointmentStatus.PENDING &&
                a.getStatus() != Appointment.AppointmentStatus.CONFIRMED) {
            throw new RuntimeException("Lịch hẹn đã được tiếp nhận hoặc xử lý, không thể hủy.");
        }

        if (!a.getUser().getId().equals(userId)) {
            User user = userRepository.findById(userId).orElseThrow();
            if (user.getRole() != User.Role.DOCTOR || !a.getDoctor().getUser().getId().equals(userId)) {
                throw new RuntimeException("Unauthorized to cancel this appointment");
            }
        }

        a.setStatus(Appointment.AppointmentStatus.CANCELLED);
        appointmentRepository.save(a);

        if (a.getSchedule() != null) {
            messagingTemplate.convertAndSend("/topic/slots", a.getSchedule().getId());
        }
    }

    private AppointmentDTO mapToDTO(Appointment a) {
        return AppointmentDTO.builder()
                .id(a.getId())
                .appointmentCode(a.getAppointmentCode())
                .appointmentDate(a.getAppointmentDate())
                .appointmentTime(a.getAppointmentTime())
                .status(a.getStatus())
                .paymentStatus(a.getPaymentStatus())
                .assignedRoom(a.getAssignedRoom())
                .queueNumber(a.getQueueNumber())
                .patientName((a.getPatientName() != null && !a.getPatientName().isBlank()) ? a.getPatientName()
                        : a.getUser().getFullName())
                .patientPhone((a.getPatientPhone() != null && !a.getPatientPhone().isBlank()) ? a.getPatientPhone()
                        : a.getUser().getPhoneNumber())
                .patientAddress(
                        (a.getPatientAddress() != null && !a.getPatientAddress().isBlank()) ? a.getPatientAddress()
                                : null)
                .doctor(mapDoctorSummary(a.getDoctor()))
                .hospital(mapHospitalSummary(a.getHospital()))
                .build();
    }

    private DoctorSummaryDTO mapDoctorSummary(Doctor d) {
        if (d == null)
            return null;

        SpecialtyDTO spec = d.getSpecialty() != null ? new SpecialtyDTO(
                d.getSpecialty().getId(),
                d.getSpecialty().getName(),
                d.getSpecialty().getSlug(),
                d.getSpecialty().getDescription(),
                d.getSpecialty().getCreatedAt(),
                d.getSpecialty().getUpdatedAt()) : null;

        return new DoctorSummaryDTO(d.getId(), d.getFullName(), d.getAvatar(), d.getRatingAvg(), d.getRatingCount(),
                d.getFeeMin(), d.getFeeMax(), d.getExperienceYears(), d.getWorkingRoom(), spec,
                mapHospitalSummary(d.getHospital()));
    }

    private HospitalSummaryDTO mapHospitalSummary(Hospital h) {
        if (h == null)
            return null;
        return new HospitalSummaryDTO(h.getId(), h.getName(), h.getImageUrl());
    }
}
