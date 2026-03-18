package com.clinic.booking.component;

import com.clinic.booking.repository.SlotLockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class SlotLockCleanupTask {

    private final SlotLockRepository slotLockRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Scheduled(fixedRate = 60000) // Chạy mỗi phút
    @Transactional
    public void cleanupExpiredLocks() {
        LocalDateTime now = LocalDateTime.now();
        // Xóa và gửi tín hiệu nếu có lock hết hạn
        slotLockRepository.deleteExpiredLocks(now);
        messagingTemplate.convertAndSend("/topic/slots", "cleanup");
    }
}
