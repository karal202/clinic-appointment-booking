package com.clinic.booking.dto;

import com.clinic.booking.entity.Schedule;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleDTO {
    private Long id;
    private Long doctorId;
    private Schedule.Session session;
    private LocalDate workDate;
    private Boolean isAvailable;
    private Integer maxPatients;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer slotMinutes;
    private String room;
    private Integer capacity;
}
