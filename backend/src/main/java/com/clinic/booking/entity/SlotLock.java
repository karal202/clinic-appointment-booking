package com.clinic.booking.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "slot_locks")
@Data
@NoArgsConstructor
public class SlotLock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long scheduleId;
    private Long userId;
    private LocalDateTime expireAt;

    public SlotLock(Long scheduleId, Long userId, int minutes) {
        this.scheduleId = scheduleId;
        this.userId = userId;
        this.expireAt = LocalDateTime.now().plusMinutes(minutes);
    }
}
