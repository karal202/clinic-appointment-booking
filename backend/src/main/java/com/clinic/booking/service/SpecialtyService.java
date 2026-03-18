package com.clinic.booking.service;

import com.clinic.booking.dto.SpecialtyDTO;
import com.clinic.booking.entity.Specialty;
import com.clinic.booking.exception.ResourceNotFoundException;
import com.clinic.booking.repository.SpecialtyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SpecialtyService {

    private final SpecialtyRepository specialtyRepository;

    public List<SpecialtyDTO> getAllSpecialties() {
        return specialtyRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public SpecialtyDTO getSpecialtyById(Long id) {
        Specialty s = specialtyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Specialty not found"));
        return mapToDTO(s);
    }

    @Transactional
    public SpecialtyDTO createSpecialty(SpecialtyDTO dto) {
        Specialty s = new Specialty();
        s.setName(dto.getName());
        s.setSlug(dto.getSlug());
        s.setDescription(dto.getDescription());
        return mapToDTO(specialtyRepository.save(s));
    }

    @Transactional
    public SpecialtyDTO updateSpecialty(Long id, SpecialtyDTO dto) {
        Specialty s = specialtyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Specialty not found"));
        s.setName(dto.getName());
        s.setSlug(dto.getSlug());
        s.setDescription(dto.getDescription());
        return mapToDTO(specialtyRepository.save(s));
    }

    @Transactional
    public void deleteSpecialty(Long id) {
        specialtyRepository.deleteById(id);
    }

    private SpecialtyDTO mapToDTO(Specialty s) {
        return new SpecialtyDTO(s.getId(), s.getName(), s.getSlug(), s.getDescription(), s.getCreatedAt(),
                s.getUpdatedAt());
    }
}
