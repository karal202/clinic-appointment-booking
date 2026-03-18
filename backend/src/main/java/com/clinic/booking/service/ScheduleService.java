package com.clinic.booking.service;

import com.clinic.booking.dto.ScheduleDTO;
import com.clinic.booking.entity.Doctor;
import com.clinic.booking.entity.Schedule;
import com.clinic.booking.exception.ResourceNotFoundException;
import com.clinic.booking.repository.DoctorRepository;
import com.clinic.booking.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final DoctorRepository doctorRepository;

    public List<ScheduleDTO> getSchedulesByDoctor(Long doctorId) {
        return scheduleRepository.findAll().stream()
                .filter(s -> s.getDoctor().getId().equals(doctorId))
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ScheduleDTO createSchedule(ScheduleDTO dto) {
        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        Schedule s = new Schedule();
        s.setDoctor(doctor);
        s.setWorkDate(dto.getWorkDate());
        s.setSession(dto.getSession());
        s.setStartTime(dto.getStartTime());
        s.setEndTime(dto.getEndTime());
        s.setMaxPatients(dto.getMaxPatients());
        s.setIsAvailable(dto.getIsAvailable() != null ? dto.getIsAvailable() : true);
        s.setSlotMinutes(dto.getSlotMinutes() != null ? dto.getSlotMinutes() : 60);
        s.setRoom(dto.getRoom());
        s.setCapacity(dto.getCapacity() != null ? dto.getCapacity() : 1);

        return mapToDTO(scheduleRepository.save(s));
    }

    @Transactional
    public ScheduleDTO updateSchedule(Long id, ScheduleDTO dto) {
        Schedule s = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found"));

        s.setWorkDate(dto.getWorkDate());
        s.setSession(dto.getSession());
        s.setStartTime(dto.getStartTime());
        s.setEndTime(dto.getEndTime());
        s.setMaxPatients(dto.getMaxPatients());
        s.setIsAvailable(dto.getIsAvailable());
        s.setSlotMinutes(dto.getSlotMinutes());
        s.setRoom(dto.getRoom());
        s.setCapacity(dto.getCapacity());

        return mapToDTO(scheduleRepository.save(s));
    }

    @Transactional
    public void deleteSchedule(Long id) {
        scheduleRepository.deleteById(id);
    }

    private ScheduleDTO mapToDTO(Schedule s) {
        return ScheduleDTO.builder()
                .id(s.getId())
                .doctorId(s.getDoctor().getId())
                .session(s.getSession())
                .workDate(s.getWorkDate())
                .isAvailable(s.getIsAvailable())
                .maxPatients(s.getMaxPatients())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .slotMinutes(s.getSlotMinutes())
                .room(s.getRoom())
                .capacity(s.getCapacity())
                .build();
    }
}
