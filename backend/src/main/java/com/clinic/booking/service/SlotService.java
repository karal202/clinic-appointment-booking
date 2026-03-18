package com.clinic.booking.service;

import com.clinic.booking.dto.SlotDTO;
import com.clinic.booking.entity.DoctorAvailability;
import com.clinic.booking.entity.Schedule;
import com.clinic.booking.entity.SlotLock;
import com.clinic.booking.repository.AppointmentRepository;
import com.clinic.booking.repository.DoctorAvailabilityRepository;
import com.clinic.booking.repository.ScheduleRepository;
import com.clinic.booking.repository.SlotLockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SlotService {

    private final DoctorAvailabilityRepository availabilityRepository;
    private final AppointmentRepository appointmentRepository;
    private final ScheduleRepository scheduleRepository;
    private final SlotLockRepository slotLockRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public List<SlotDTO> generateSlotsForDoctorOnDate(Long doctorId, LocalDate date) {
        // 1. Kiểm tra xem đã có lịch (Schedule) trong DB chưa
        List<Schedule> existingSchedules = scheduleRepository.findByDoctorIdAndWorkDate(doctorId, date);

        LocalDateTime now = LocalDateTime.now();

        // Nếu đã có lịch
        if (!existingSchedules.isEmpty()) {
            return existingSchedules.stream().map(s -> {
                long bookedCount = appointmentRepository.countByDoctorAndScheduleStartTime(doctorId, s.getStartTime());
                long activeLocks = slotLockRepository.countByScheduleIdAndExpireAtAfter(s.getId(), now);

                // Tổng số người đang chiếm dụng = Đã đặt + Đang chọn
                long totalOccupied = bookedCount + activeLocks;

                // Mặc định giới hạn theo cấu hình bệnh viện
                int limit = s.getMaxPatients();

                boolean available = s.getIsAvailable() && totalOccupied < limit;

                return new SlotDTO(s.getId(), s.getStartTime(), s.getEndTime(), limit, totalOccupied, available);
            }).sorted((a, b) -> a.getStart().compareTo(b.getStart())).collect(Collectors.toList());
        }

        // 2. Nếu chưa có, tạo mới từ Availability
        int dayOfWeek = date.getDayOfWeek().getValue();
        List<DoctorAvailability> availabilities = availabilityRepository
                .findByDoctorIdAndDayOfWeekAndIsActiveTrue(doctorId, dayOfWeek);

        List<Schedule> newSchedules = new ArrayList<>();
        for (DoctorAvailability availability : availabilities) {
            LocalTime currentTime = availability.getStartTime();
            LocalTime endTime = availability.getEndTime();
            Integer slotMinutes = availability.getSlotMinutes();
            Integer capacity = availability.getCapacity();

            while (!currentTime.isAfter(endTime.minusMinutes(slotMinutes))) {
                LocalDateTime slotStart = LocalDateTime.of(date, currentTime);
                LocalDateTime slotEnd = slotStart.plusMinutes(slotMinutes);

                Schedule s = new Schedule();
                s.setDoctor(availability.getDoctor());
                s.setWorkDate(date);
                s.setStartTime(slotStart);
                s.setEndTime(slotEnd);
                s.setSlotMinutes(slotMinutes);
                s.setMaxPatients(capacity);
                s.setCapacity(capacity);
                s.setBookedPatients(0);
                s.setIsAvailable(true);

                if (currentTime.isBefore(LocalTime.of(12, 0)))
                    s.setSession(Schedule.Session.morning);
                else if (currentTime.isBefore(LocalTime.of(18, 0)))
                    s.setSession(Schedule.Session.afternoon);
                else
                    s.setSession(Schedule.Session.evening);

                newSchedules.add(s);
                currentTime = currentTime.plusMinutes(slotMinutes);
            }
        }

        if (!newSchedules.isEmpty()) {
            List<Schedule> savedSchedules = scheduleRepository.saveAll(newSchedules);
            return savedSchedules.stream()
                    .map(s -> new SlotDTO(s.getId(), s.getStartTime(), s.getEndTime(), s.getMaxPatients(), 0L, true))
                    .sorted((a, b) -> a.getStart().compareTo(b.getStart())).collect(Collectors.toList());
        }

        return new ArrayList<>();
    }

    @Transactional
    public void lockSlot(Long scheduleId, Long userId) {
        // 1. Kiểm tra slot có tồn tại không
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Khung giờ không tồn tại"));

        // 2. Tìm và xóa các lock cũ của user này
        List<SlotLock> existingLocks = slotLockRepository.findByUserId(userId);
        if (!existingLocks.isEmpty()) {
            slotLockRepository.deleteAll(existingLocks);
            slotLockRepository.flush(); // Flush để đảm bảo query count phía dưới chính xác

            // Gửi thông báo WebSocket cho các slot cũ bị nhả ra
            for (SlotLock oldLock : existingLocks) {
                if (!oldLock.getScheduleId().equals(scheduleId)) {
                    messagingTemplate.convertAndSend("/topic/slots", oldLock.getScheduleId());
                }
            }
        }

        // 3. Kiểm tra slot có đang mở không
        if (!schedule.getIsAvailable()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT, "Khung giờ này hiện không phục vụ");
        }

        LocalDateTime now = LocalDateTime.now();

        // Đếm số người đã đặt thành công (trừ các ca đã hủy)
        long bookedCount = appointmentRepository.countByDoctorAndScheduleStartTime(
                schedule.getDoctor().getId(), schedule.getStartTime());

        // Đếm số người đang giữ chỗ (Locks) - lúc này đã xóa lock cũ của user hiện tại
        long activeLocks = slotLockRepository.countByScheduleIdAndExpireAtAfter(scheduleId, now);

        // 4. Kiểm tra sức chứa (Capacity)
        // Nếu đã hết chỗ (Đã đặt + Đang giữ chỗ >= MaxPatients)
        if (bookedCount + activeLocks >= schedule.getMaxPatients()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "Rất tiếc, khung giờ này vừa có người chọn. Vui lòng chọn giờ khác.");
        }

        // 5. Tạo lock mới
        SlotLock lock = new SlotLock(scheduleId, userId, 10); // Giữ chỗ trong 10 phút
        slotLockRepository.save(lock);

        // 6. Thông báo cho các client khác qua WebSocket
        messagingTemplate.convertAndSend("/topic/slots", scheduleId);
    }

    @Transactional
    public void unlockSlotsForUser(Long userId) {
        List<SlotLock> existingLocks = slotLockRepository.findByUserId(userId);
        if (!existingLocks.isEmpty()) {
            slotLockRepository.deleteAll(existingLocks);
            for (SlotLock oldLock : existingLocks) {
                messagingTemplate.convertAndSend("/topic/slots", oldLock.getScheduleId());
            }
        }
    }
}