package com.clinic.booking.controller;

import com.clinic.booking.dto.ScheduleDTO;
import com.clinic.booking.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ScheduleController {

    private final ScheduleService scheduleService;

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<ScheduleDTO>> getByDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(scheduleService.getSchedulesByDoctor(doctorId));
    }

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<ScheduleDTO> create(@RequestBody ScheduleDTO dto) {
        return ResponseEntity.ok(scheduleService.createSchedule(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<ScheduleDTO> update(@PathVariable Long id, @RequestBody ScheduleDTO dto) {
        return ResponseEntity.ok(scheduleService.updateSchedule(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        scheduleService.deleteSchedule(id);
        return ResponseEntity.noContent().build();
    }
}
