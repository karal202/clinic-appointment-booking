package com.clinic.booking.controller;

import com.clinic.booking.dto.SlotDTO;
import com.clinic.booking.service.SlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/slots")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SlotController {

    private final SlotService slotService;

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<SlotDTO>> getSlotsForDoctor(
            @PathVariable Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(slotService.generateSlotsForDoctorOnDate(doctorId, date));
    }

    @PostMapping("/lock/{scheduleId}")
    public ResponseEntity<Void> lockSlot(@PathVariable Long scheduleId, @RequestParam Long userId) {
        slotService.lockSlot(scheduleId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/unlock/user/{userId}")
    public ResponseEntity<Void> unlockSlotsForUser(@PathVariable Long userId) {
        slotService.unlockSlotsForUser(userId);
        return ResponseEntity.ok().build();
    }
}
