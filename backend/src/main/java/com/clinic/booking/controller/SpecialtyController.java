package com.clinic.booking.controller;

import com.clinic.booking.dto.SpecialtyDTO;
import com.clinic.booking.service.SpecialtyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/specialties")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SpecialtyController {

    private final SpecialtyService specialtyService;

    @GetMapping
    public ResponseEntity<List<SpecialtyDTO>> getAll() {
        return ResponseEntity.ok(specialtyService.getAllSpecialties());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SpecialtyDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(specialtyService.getSpecialtyById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SpecialtyDTO> create(@RequestBody SpecialtyDTO dto) {
        return ResponseEntity.ok(specialtyService.createSpecialty(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SpecialtyDTO> update(@PathVariable Long id, @RequestBody SpecialtyDTO dto) {
        return ResponseEntity.ok(specialtyService.updateSpecialty(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        specialtyService.deleteSpecialty(id);
        return ResponseEntity.noContent().build();
    }
}
