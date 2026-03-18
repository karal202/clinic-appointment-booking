package com.clinic.booking.repository;

import com.clinic.booking.entity.SlotLock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface SlotLockRepository extends JpaRepository<SlotLock, Long> {
    long countByScheduleIdAndExpireAtAfter(Long scheduleId, LocalDateTime now);

    List<SlotLock> findByUserId(Long userId);

    void deleteByUserId(Long userId);

    @Modifying
    @Query("DELETE FROM SlotLock s WHERE s.expireAt < :now")
    void deleteExpiredLocks(LocalDateTime now);

    boolean existsByScheduleIdAndUserIdAndExpireAtAfter(Long scheduleId, Long userId, LocalDateTime now);
}
