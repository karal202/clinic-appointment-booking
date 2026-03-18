package com.clinic.booking.controller;

import com.clinic.booking.dto.DoctorDTO;
import com.clinic.booking.dto.DoctorSummaryDTO;
import com.clinic.booking.repository.UserRepository;
import com.clinic.booking.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DoctorController {

    private final DoctorService doctorService;
    private final UserRepository userRepository;
    private final com.clinic.booking.repository.StaffRepository staffRepository;

    @GetMapping("/me")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<DoctorDTO> getMe() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Long userId = userRepository.findByEmail(email).orElseThrow().getId();
        return ResponseEntity.ok(doctorService.getDoctorByUserId(userId));
    }

    @GetMapping
    public ResponseEntity<List<DoctorSummaryDTO>> getAll() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (email == null || email.equals("anonymousUser")) {
            return ResponseEntity.ok(doctorService.getAllDoctors());
        }

        com.clinic.booking.entity.User user = userRepository.findByEmail(email).orElse(null);
        if (user != null && user.getRole() == com.clinic.booking.entity.User.Role.STAFF) {
            return staffRepository.findByUserId(user.getId())
                    .map(staff -> ResponseEntity.ok(doctorService.getDoctorsByHospital(staff.getHospital().getId())))
                    .orElseGet(() -> ResponseEntity.ok(java.util.Collections.emptyList()));
        }

        return ResponseEntity.ok(doctorService.getAllDoctors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DoctorDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getDoctorById(id));
    }

    @GetMapping("/hospital/{hospitalId}")
    public ResponseEntity<List<DoctorSummaryDTO>> getByHospital(@PathVariable Long hospitalId) {
        return ResponseEntity.ok(doctorService.getDoctorsByHospital(hospitalId));
    }

    @GetMapping("/specialty/{specialtyId}")
    public ResponseEntity<List<DoctorSummaryDTO>> getBySpecialty(@PathVariable Long specialtyId) {
        return ResponseEntity.ok(doctorService.getDoctorsBySpecialty(specialtyId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<DoctorSummaryDTO>> search(
            @RequestParam(required = false, name = "q") String q,
            @RequestParam(required = false, name = "specialtyId") Long specialtyId,
            @RequestParam(required = false, name = "hospitalId") Long hospitalId) {
        return ResponseEntity.ok(doctorService.getDoctors(q, specialtyId, hospitalId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DoctorDTO> create(@RequestBody DoctorDTO dto) {
        return ResponseEntity.ok(doctorService.createDoctor(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DoctorDTO> update(@PathVariable Long id, @RequestBody DoctorDTO dto) {
        return ResponseEntity.ok(doctorService.updateDoctor(id, dto));
    }

    @PatchMapping("/{id}/room")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<DoctorDTO> updateRoom(@PathVariable Long id, @RequestParam String room) {
        return ResponseEntity.ok(doctorService.updateWorkingRoom(id, room));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        doctorService.deleteDoctor(id);
        return ResponseEntity.noContent().build();
    }
}
