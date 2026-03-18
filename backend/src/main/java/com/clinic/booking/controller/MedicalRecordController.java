package com.clinic.booking.controller;

import com.clinic.booking.dto.MedicalRecordDTO;
import com.clinic.booking.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medical-records")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<MedicalRecordDTO>> getRecordsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(medicalRecordService.getRecordsByUser(userId));
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<List<MedicalRecordDTO>> getRecordsByDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(medicalRecordService.getRecordsByDoctor(doctorId));
    }

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<MedicalRecordDTO> createRecord(@RequestBody MedicalRecordDTO dto) {
        return ResponseEntity.ok(medicalRecordService.createRecord(dto));
    }
}
