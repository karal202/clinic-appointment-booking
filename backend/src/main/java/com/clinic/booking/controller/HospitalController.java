package com.clinic.booking.controller;

import com.clinic.booking.dto.HospitalDTO;
import com.clinic.booking.service.HospitalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hospitals")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HospitalController {

    private final HospitalService hospitalService;
    private final com.clinic.booking.repository.UserRepository userRepository;
    private final com.clinic.booking.repository.StaffRepository staffRepository;

    @GetMapping
    public ResponseEntity<List<HospitalDTO>> getAll() {
        return ResponseEntity.ok(hospitalService.getAllHospitals());
    }

    @GetMapping("/staff/me")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<HospitalDTO> getMyHospital() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        com.clinic.booking.entity.User user = userRepository.findByEmail(email).orElseThrow();
        com.clinic.booking.entity.Staff staff = staffRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Staff profile not found"));
        return ResponseEntity.ok(hospitalService.getHospitalById(staff.getHospital().getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HospitalDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(hospitalService.getHospitalById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<HospitalDTO>> search(@RequestParam(required = false, name = "q") String q) {
        return ResponseEntity.ok(hospitalService.searchHospitals(q));
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> getStatistics() {
        return ResponseEntity.ok(hospitalService.getHospitalStatistics());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HospitalDTO> create(@RequestBody HospitalDTO dto) {
        return ResponseEntity.ok(hospitalService.createHospital(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HospitalDTO> update(@PathVariable Long id, @RequestBody HospitalDTO dto) {
        return ResponseEntity.ok(hospitalService.updateHospital(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        hospitalService.deleteHospital(id);
        return ResponseEntity.noContent().build();
    }
}
