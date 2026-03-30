package com.clinic.booking.service;

import com.clinic.booking.dto.DoctorSummaryDTO;
import com.clinic.booking.dto.HospitalDTO;
import com.clinic.booking.dto.HospitalSummaryDTO;
import com.clinic.booking.dto.SpecialtyDTO;
import com.clinic.booking.entity.Doctor;
import com.clinic.booking.entity.Hospital;
import com.clinic.booking.entity.Specialty;
import com.clinic.booking.exception.ResourceNotFoundException;
import com.clinic.booking.repository.DoctorRepository;
import com.clinic.booking.repository.HospitalRepository;
import com.clinic.booking.repository.SpecialtyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HospitalService {

    private final HospitalRepository hospitalRepository;
    private final SpecialtyRepository specialtyRepository;
    private final DoctorRepository doctorRepository;
    private final com.clinic.booking.repository.AppointmentRepository appointmentRepository;
    private final com.clinic.booking.repository.UserRepository userRepository;

    public List<HospitalDTO> getAllHospitals() {
        return hospitalRepository.findAll().stream()
                .filter(Objects::nonNull)
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public HospitalDTO getHospitalById(Long id) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found"));
        return mapToDTO(hospital);
    }

    public List<HospitalDTO> searchHospitals(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return getAllHospitals();
        }
        return hospitalRepository.searchHospitals(keyword).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public HospitalDTO createHospital(HospitalDTO dto) {
        Hospital h = new Hospital();
        h.setName(dto.getName());
        h.setAddress(dto.getAddress());
        h.setPhone(dto.getPhone());
        h.setImageUrl(dto.getImageUrl());
        h.setDetails(dto.getDetails());
        h.setRooms(dto.getRooms());
        return mapToDTO(hospitalRepository.save(h));
    }

    @Transactional
    public HospitalDTO updateHospital(Long id, HospitalDTO dto) {
        Hospital h = hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found"));
        h.setName(dto.getName());
        h.setAddress(dto.getAddress());
        h.setPhone(dto.getPhone());
        h.setImageUrl(dto.getImageUrl());
        h.setDetails(dto.getDetails());
        h.setRooms(dto.getRooms());
        return mapToDTO(hospitalRepository.save(h));
    }

    @Transactional
    public void deleteHospital(Long id) {
        List<Doctor> doctors = doctorRepository.findByHospitalId(id);
        if (doctors != null) {
            for (Doctor d : doctors) {
                d.setHospital(null);
                doctorRepository.save(d);
            }
        }
        hospitalRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getHospitalStatistics() {
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalHospitals", hospitalRepository.count());
        stats.put("totalDoctors", doctorRepository.count());
        stats.put("totalSpecialties", specialtyRepository.count());

        // Simple revenue metrics (last 30 days)
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate start = today.minusDays(30);
        Long paidCount = appointmentRepository.countPaidAppointmentsBetween(start, today);
        java.math.BigDecimal revenue = appointmentRepository.sumRevenueFromPaidAppointmentsBetween(start, today);

        stats.put("paidAppointmentsLast30Days", paidCount != null ? paidCount : 0);
        stats.put("estimatedRevenueLast30Days", revenue != null ? revenue : java.math.BigDecimal.ZERO);

        // total users
        stats.put("totalUsers", userRepository.count());

        return stats;
    }

    private HospitalDTO mapToDTO(Hospital h) {
        HospitalDTO dto = new HospitalDTO();
        dto.setId(h.getId());
        dto.setName(h.getName());
        dto.setAddress(h.getAddress());
        dto.setPhone(h.getPhone());
        dto.setImageUrl(h.getImageUrl());
        dto.setDetails(h.getDetails());
        List<String> rooms = h.getRooms();
        if (rooms == null || rooms.isEmpty()) {
            rooms = java.util.Arrays.asList("Phòng 101", "Phòng 102", "Phòng Cấp cứu", "Phòng Xét nghiệm");
        }
        dto.setRooms(rooms);
        dto.setCreatedAt(h.getCreatedAt());
        dto.setUpdatedAt(h.getUpdatedAt());

        if (h.getSpecialties() != null) {
            List<SpecialtyDTO> specialties = h.getSpecialties().stream().map(this::mapSpecialty)
                    .collect(Collectors.toList());
            dto.setSpecialties(specialties);
        }

        if (h.getDoctors() != null) {
            List<DoctorSummaryDTO> docs = h.getDoctors().stream().map(this::mapDoctorSummary)
                    .collect(Collectors.toList());
            dto.setDoctors(docs);
        }

        return dto;
    }

    private SpecialtyDTO mapSpecialty(Specialty s) {
        return new SpecialtyDTO(s.getId(), s.getName(), s.getSlug(), s.getDescription(), s.getCreatedAt(),
                s.getUpdatedAt());
    }

    private DoctorSummaryDTO mapDoctorSummary(Doctor d) {
        HospitalSummaryDTO hospital = d.getHospital() != null ? new HospitalSummaryDTO(d.getHospital().getId(),
                d.getHospital().getName(), d.getHospital().getImageUrl()) : null;

        SpecialtyDTO spec = d.getSpecialty() != null ? mapSpecialty(d.getSpecialty()) : null;

        return new DoctorSummaryDTO(d.getId(), d.getFullName(), d.getAvatar(), d.getRatingAvg(), d.getRatingCount(),
                d.getFeeMin(), d.getFeeMax(), d.getExperienceYears(), d.getWorkingRoom(), spec, hospital);
    }
}
