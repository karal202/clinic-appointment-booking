package com.clinic.booking.controller;

import com.clinic.booking.dto.AppointmentDTO;
import com.clinic.booking.dto.NotificationDTO;
import com.clinic.booking.entity.User;
import com.clinic.booking.repository.UserRepository;
import com.clinic.booking.service.AppointmentService;
import com.clinic.booking.service.NotificationService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final AppointmentService appointmentService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentDTO>> getMyAppointments() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(appointmentService.getMyAppointments(userId));
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationDTO>> getMyNotifications() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(notificationService.getMyNotifications(userId));
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(userRepository.findByEmail(email).orElseThrow());
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(@Valid @RequestBody com.clinic.booking.dto.UpdateProfileRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty())
            user.setFullName(request.getFullName().trim());
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().trim().isEmpty())
            user.setPhoneNumber(request.getPhoneNumber().trim());
        if (request.getAddress() != null && !request.getAddress().trim().isEmpty())
            user.setAddress(request.getAddress().trim());
        if (request.getGender() != null && !request.getGender().trim().isEmpty())
            user.setGender(request.getGender().trim());
        if (request.getDateOfBirth() != null)
            user.setDateOfBirth(request.getDateOfBirth());

        return ResponseEntity.ok(userRepository.save(user));
    }

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow().getId();
    }
}
