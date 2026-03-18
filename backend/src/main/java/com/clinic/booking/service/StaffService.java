package com.clinic.booking.service;

import com.clinic.booking.dto.StaffDTO;
import com.clinic.booking.entity.Hospital;
import com.clinic.booking.entity.Staff;
import com.clinic.booking.entity.User;
import com.clinic.booking.exception.ResourceNotFoundException;
import com.clinic.booking.repository.HospitalRepository;
import com.clinic.booking.repository.StaffRepository;
import com.clinic.booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffService {

    private final StaffRepository staffRepository;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final PasswordEncoder passwordEncoder;

    public List<StaffDTO> getAllStaff() {
        return staffRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public StaffDTO createStaff(StaffDTO dto) {
        // 1. Find or Create User account
        User user = userRepository.findByEmail(dto.getUserEmail())
                .orElseGet(() -> {
                    // Create new account if not exists
                    if (dto.getPassword() == null || dto.getPassword().isEmpty()) {
                        throw new RuntimeException("Password is required for new Staff accounts");
                    }
                    User newUser = new User();
                    newUser.setEmail(dto.getUserEmail());
                    newUser.setFullName(dto.getUserFullName() != null ? dto.getUserFullName() : "Staff Member");
                    newUser.setPassword(passwordEncoder.encode(dto.getPassword()));
                    newUser.setRole(User.Role.STAFF);
                    newUser.setAuthProvider(User.AuthProvider.LOCAL);
                    newUser.setIsActive(true);
                    newUser.setEmailVerified(true); // Pre-verify since created by Admin
                    return userRepository.save(newUser);
                });

        // 2. Ensure user has STAFF role in all cases
        if (user.getRole() != User.Role.STAFF) {
            user.setRole(User.Role.STAFF);
            userRepository.save(user);
        }

        // 3. Find Hospital
        Hospital hospital = hospitalRepository.findById(dto.getHospitalId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found"));

        // 4. Check if already recorded in Staff table
        if (staffRepository.findByUserId(user.getId()).isPresent()) {
            throw new RuntimeException("User '" + dto.getUserEmail() + "' is already assigned to a hospital");
        }

        // 5. Create Staff record
        Staff staff = new Staff();
        staff.setUser(user);
        staff.setHospital(hospital);
        staff.setPosition(dto.getPosition());
        staff.setIsActive(true);

        return mapToDTO(staffRepository.save(staff));
    }

    @Transactional
    public StaffDTO updateStaff(Long id, StaffDTO dto) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff record not found"));

        Hospital hospital = hospitalRepository.findById(dto.getHospitalId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found"));

        staff.setHospital(hospital);
        staff.setPosition(dto.getPosition());
        staff.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : staff.getIsActive());

        return mapToDTO(staffRepository.save(staff));
    }

    @Transactional
    public void deleteStaff(Long id) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff record not found"));

        // Downgrade user role to USER
        User user = staff.getUser();
        if (user.getRole() == User.Role.STAFF) {
            user.setRole(User.Role.USER);
            userRepository.save(user);
        }

        staffRepository.delete(staff);
    }

    private StaffDTO mapToDTO(Staff s) {
        return StaffDTO.builder()
                .id(s.getId())
                .userId(s.getUser().getId())
                .userEmail(s.getUser().getEmail())
                .userFullName(s.getUser().getFullName())
                .hospitalId(s.getHospital().getId())
                .hospitalName(s.getHospital().getName())
                .position(s.getPosition())
                .isActive(s.getIsActive())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
