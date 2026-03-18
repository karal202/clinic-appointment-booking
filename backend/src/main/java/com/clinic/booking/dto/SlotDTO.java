package com.clinic.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SlotDTO {
    private Long id;
    private LocalDateTime start;
    private LocalDateTime end;
    private Integer capacity;
    private Long bookedCount;
    private Boolean available;
}
