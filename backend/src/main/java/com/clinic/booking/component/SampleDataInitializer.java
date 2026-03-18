package com.clinic.booking.component;

import com.clinic.booking.entity.Hospital;
import com.clinic.booking.entity.Staff;
import com.clinic.booking.entity.User;
import com.clinic.booking.repository.HospitalRepository;
import com.clinic.booking.repository.StaffRepository;
import com.clinic.booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class SampleDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final StaffRepository staffRepository;
    private final HospitalRepository hospitalRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // 1. Create Sample Staff User if not exists
        if (userRepository.findByEmail("staff@clinic.com").isEmpty()) {
            User staffUser = new User();
            staffUser.setEmail("staff@clinic.com");
            staffUser.setPassword(passwordEncoder.encode("staff123"));
            staffUser.setFullName("Nguyễn Văn Lễ Tân");
            staffUser.setPhoneNumber("0987654321");
            staffUser.setRole(User.Role.STAFF);
            staffUser.setIsActive(true);
            userRepository.save(staffUser);

            // 2. Link Staff to a Hospital
            List<Hospital> hospitals = hospitalRepository.findAll();
            if (!hospitals.isEmpty()) {
                Hospital targetHospital = hospitals.get(0);

                // Initialize rooms if empty
                if (targetHospital.getRooms() == null || targetHospital.getRooms().isEmpty()) {
                    targetHospital.setRooms(Arrays.asList("Phòng 101", "Phòng 102", "Phòng Cấp cứu", "Phòng Chờ"));
                    hospitalRepository.save(targetHospital);
                }

                Staff staffRecord = new Staff();
                staffRecord.setUser(staffUser);
                staffRecord.setHospital(targetHospital);
                staffRecord.setPosition("Trưởng quầy lễ tân");
                staffRecord.setIsActive(true);
                staffRepository.save(staffRecord);

                System.out.println(">>> Sample Staff created: email: staff@clinic.com / pass: staff123");
            }
        }
    }

}
