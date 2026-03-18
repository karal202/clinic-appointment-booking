package com.clinic.booking.service;

import com.clinic.booking.dto.NotificationDTO;
import com.clinic.booking.entity.Notification;
import com.clinic.booking.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final com.clinic.booking.repository.UserRepository userRepository;

    @Transactional
    public NotificationDTO createNotification(Long userId, String message) {
        com.clinic.booking.entity.User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification n = new Notification();
        n.setUser(user);
        n.setMessage(message);
        n.setKind(Notification.NotificationKind.other);
        n.setIsRead(false);

        return mapToDTO(notificationRepository.save(n));
    }

    public List<NotificationDTO> getMyNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderBySentAtDesc(userId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        n.setIsRead(true);
        notificationRepository.save(n);
    }

    private NotificationDTO mapToDTO(Notification n) {
        return NotificationDTO.builder()
                .id(n.getId())
                .title(n.getKind().name())
                .message(n.getMessage())
                .type(mapKindToType(n.getKind()))
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }

    private String mapKindToType(Notification.NotificationKind kind) {
        return switch (kind) {
            case booked, confirmed -> "success";
            case cancelled -> "warning";
            case upcoming_24h, upcoming_2h -> "info";
            default -> "info";
        };
    }
}
