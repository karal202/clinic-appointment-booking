package com.clinic.booking.controller;

import com.clinic.booking.dto.AppointmentDTO;
import com.clinic.booking.dto.AppointmentRequest;
import com.clinic.booking.entity.Appointment;
import com.clinic.booking.repository.UserRepository;
import com.clinic.booking.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final UserRepository userRepository;
    private final com.clinic.booking.repository.StaffRepository staffRepository;

    @PostMapping
    public ResponseEntity<AppointmentDTO> createAppointment(@Valid @RequestBody AppointmentRequest request) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(appointmentService.createAppointment(userId, request));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelAppointment(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        appointmentService.cancelAppointment(id, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<List<AppointmentDTO>> getByDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(appointmentService.getDoctorAppointments(doctorId));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<List<AppointmentDTO>> getAll() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        com.clinic.booking.entity.User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == com.clinic.booking.entity.User.Role.STAFF) {
            return staffRepository.findByUserId(user.getId())
                    .map(staff -> ResponseEntity
                            .ok(appointmentService.getHospitalAppointments(staff.getHospital().getId())))
                    .orElseGet(() -> ResponseEntity.ok(java.util.Collections.emptyList()));
        }

        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    @GetMapping("/code/{appointmentCode}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<AppointmentDTO> getByCode(@PathVariable String appointmentCode) {
        return ResponseEntity.ok(appointmentService.getAppointmentByCode(appointmentCode));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<AppointmentDTO> updateStatus(@PathVariable Long id,
            @RequestParam Appointment.AppointmentStatus status) {
        return ResponseEntity.ok(appointmentService.updateAppointmentStatus(id, status));
    }

    @PatchMapping("/{id}/assign-room")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<AppointmentDTO> assignRoom(@PathVariable Long id,
            @RequestParam String roomName) {
        return ResponseEntity.ok(appointmentService.assignRoom(id, roomName));
    }

    @PatchMapping("/{id}/check-in")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<AppointmentDTO> checkIn(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.checkIn(id));
    }

    @PatchMapping("/{id}/confirm-payment")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<AppointmentDTO> confirmPayment(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.confirmPayment(id));
    }

    @PostMapping("/walk-in")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<AppointmentDTO> createWalkIn(
            @Valid @RequestBody com.clinic.booking.dto.WalkInRequest request) {
        return ResponseEntity.ok(appointmentService.createWalkInAppointment(request));
    }

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow().getId();
    }
}
