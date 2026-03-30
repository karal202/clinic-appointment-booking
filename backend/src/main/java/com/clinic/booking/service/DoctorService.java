package com.clinic.booking.service;

import com.clinic.booking.dto.DoctorDTO;
import com.clinic.booking.dto.DoctorSummaryDTO;
import com.clinic.booking.dto.SpecialtyDTO;
import com.clinic.booking.dto.HospitalSummaryDTO;
import com.clinic.booking.entity.Doctor;
import com.clinic.booking.exception.ResourceNotFoundException;
import com.clinic.booking.repository.DoctorRepository;
import com.clinic.booking.repository.HospitalRepository;
import com.clinic.booking.repository.SpecialtyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final SpecialtyRepository specialtyRepository;
    private final HospitalRepository hospitalRepository;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    public List<DoctorSummaryDTO> getAllDoctors() {
        return doctorRepository.findAll().stream().map(this::mapToSummary).collect(Collectors.toList());
    }

    public DoctorDTO getDoctorById(Long id) {
        Doctor d = doctorRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        return mapToDTO(d);
    }

    public DoctorDTO getDoctorByUserId(Long userId) {
        Doctor d = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor info not found for this user"));
        return mapToDTO(d);
    }

    public List<DoctorSummaryDTO> getDoctorsByHospital(Long hospitalId) {
        return doctorRepository.findByHospitalIdAndIsActiveTrue(hospitalId).stream().map(this::mapToSummary)
                .collect(Collectors.toList());
    }

    public List<DoctorSummaryDTO> getDoctorsBySpecialty(Long specialtyId) {
        return doctorRepository.findBySpecialtyIdAndIsActiveTrue(specialtyId).stream().map(this::mapToSummary)
                .collect(Collectors.toList());
    }

    public List<DoctorSummaryDTO> getDoctors(String keyword, Long specialtyId, Long hospitalId) {
        // If keyword is blank, treat as null
        if (keyword != null && keyword.isBlank())
            keyword = null;

        return doctorRepository.searchDoctorsWithFilters(keyword, specialtyId, hospitalId)
                .stream().map(this::mapToSummary).collect(Collectors.toList());
    }

    public List<DoctorSummaryDTO> searchDoctors(String keyword) {
        if (keyword == null || keyword.isBlank())
            return getAllDoctors();
        return doctorRepository.searchDoctors(keyword).stream().map(this::mapToSummary).collect(Collectors.toList());
    }

    @Transactional
    public DoctorDTO createDoctor(DoctorDTO dto) {
        Doctor d = new Doctor();
        mapToEntity(dto, d);
        return mapToDTO(doctorRepository.save(d));
    }

    @Transactional
    public DoctorDTO updateDoctor(Long id, DoctorDTO dto) {
        Doctor d = doctorRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        mapToEntity(dto, d);
        return mapToDTO(doctorRepository.save(d));
    }

    @Transactional
    public void deleteDoctor(Long id) {
        Doctor d = doctorRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        // Cập nhật ràng buộc: thay vì xóa cứng (sẽ mất hết lịch sử đặt khám và đánh giá)
        // Ta sẽ chuyển bác sĩ sang chế độ ngưng hoạt động (Soft Delete)
        d.setIsActive(false);
        d.setIsAvailableForBooking(false);
        
        // Xoá các chuyên khoa/bệnh viện liên kết nếu muốn, nhưng thường giữ lại để tra cứu lịch sử
        // d.setHospital(null);
        // d.setSpecialty(null);

        doctorRepository.save(d);
    }

    @Transactional
    public DoctorDTO updateWorkingRoom(Long id, String room) {
        Doctor d = doctorRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        d.setWorkingRoom(room);
        Doctor saved = doctorRepository.save(d);
        // Realtime: notify connected clients about doctor's room change
        try {
            messagingTemplate.convertAndSend("/topic/doctors", mapToDTO(saved));
        } catch (Exception ex) {
            // swallow - realtime is best-effort
        }
        return mapToDTO(saved);
    }

    private void mapToEntity(DoctorDTO dto, Doctor d) {
        d.setFullName(dto.getFullName());
        d.setGender(dto.getGender());
        d.setDateOfBirth(dto.getDateOfBirth());
        d.setPhone(dto.getPhone());
        d.setAvatar(dto.getAvatar());
        d.setLicenseNo(dto.getLicenseNo());
        d.setExperienceYears(dto.getExperienceYears());
        d.setBio(dto.getBio());
        d.setFeeMin(dto.getFeeMin());
        d.setFeeMax(dto.getFeeMax());
        d.setWorkingRoom(dto.getWorkingRoom());

        if (dto.getSpecialty() != null && dto.getSpecialty().getId() != null) {
            d.setSpecialty(specialtyRepository.findById(dto.getSpecialty().getId()).orElse(null));
        }
        if (dto.getHospital() != null && dto.getHospital().getId() != null) {
            d.setHospital(hospitalRepository.findById(dto.getHospital().getId()).orElse(null));
        }
    }

    private DoctorSummaryDTO mapToSummary(Doctor d) {
        SpecialtyDTO spec = d.getSpecialty() != null ? new SpecialtyDTO(d.getSpecialty().getId(),
                d.getSpecialty().getName(), d.getSpecialty().getSlug(), d.getSpecialty().getDescription(),
                d.getSpecialty().getCreatedAt(), d.getSpecialty().getUpdatedAt()) : null;

        HospitalSummaryDTO hospital = d.getHospital() != null ? new HospitalSummaryDTO(d.getHospital().getId(),
                d.getHospital().getName(), d.getHospital().getImageUrl()) : null;

        return new DoctorSummaryDTO(d.getId(), d.getFullName(), d.getAvatar(), d.getRatingAvg(), d.getRatingCount(),
                d.getFeeMin(), d.getFeeMax(), d.getExperienceYears(), d.getWorkingRoom(), spec, hospital);
    }

    private DoctorDTO mapToDTO(Doctor d) {
        DoctorDTO dto = new DoctorDTO();
        dto.setId(d.getId());
        dto.setUserId(d.getUser() != null ? d.getUser().getId() : null);
        dto.setFullName(d.getFullName());
        dto.setGender(d.getGender());
        dto.setDateOfBirth(d.getDateOfBirth());
        dto.setPhone(d.getPhone());
        dto.setAvatar(d.getAvatar());
        dto.setLicenseNo(d.getLicenseNo());
        dto.setExperienceYears(d.getExperienceYears());
        dto.setBio(d.getBio());
        if (d.getSpecialty() != null)
            dto.setSpecialty(new SpecialtyDTO(d.getSpecialty().getId(), d.getSpecialty().getName(),
                    d.getSpecialty().getSlug(), d.getSpecialty().getDescription(), d.getSpecialty().getCreatedAt(),
                    d.getSpecialty().getUpdatedAt()));
        if (d.getHospital() != null)
            dto.setHospital(new HospitalSummaryDTO(d.getHospital().getId(), d.getHospital().getName(),
                    d.getHospital().getImageUrl()));
        dto.setFeeMin(d.getFeeMin());
        dto.setFeeMax(d.getFeeMax());
        dto.setRatingAvg(d.getRatingAvg());
        dto.setRatingCount(d.getRatingCount());
        dto.setWorkingRoom(d.getWorkingRoom());
        dto.setCreatedAt(d.getCreatedAt());
        dto.setUpdatedAt(d.getUpdatedAt());
        return dto;
    }
}
