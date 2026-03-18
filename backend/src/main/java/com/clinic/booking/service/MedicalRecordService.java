package com.clinic.booking.service;

import com.clinic.booking.dto.MedicalRecordDTO;
import com.clinic.booking.entity.Appointment;
import com.clinic.booking.entity.MedicalRecord;
import com.clinic.booking.entity.User;
import com.clinic.booking.repository.AppointmentRepository;
import com.clinic.booking.repository.MedicalRecordRepository;
import com.clinic.booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public List<MedicalRecordDTO> getRecordsByUser(Long userId) {
        return medicalRecordRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MedicalRecordDTO> getRecordsByDoctor(Long doctorId) {
        return medicalRecordRepository.findByDoctorId(doctorId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public MedicalRecordDTO createRecord(MedicalRecordDTO dto) {
        Appointment appointment = appointmentRepository.findById(dto.getAppointmentId())
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        MedicalRecord record = MedicalRecord.builder()
                .appointment(appointment)
                .user(appointment.getUser())
                .doctor(appointment.getDoctor())
                .symptoms(dto.getSymptoms())
                .diagnosis(dto.getDiagnosis())
                .treatmentPlan(dto.getTreatmentPlan())
                .prescription(dto.getPrescription())
                .note(dto.getNote())
                .build();

        // Update appointment status to COMPLETED if it's not already
        appointment.setStatus(Appointment.AppointmentStatus.COMPLETED);
        appointmentRepository.save(appointment);

        // Send email to patient (best-effort)
        try {
            String userEmail = appointment.getUser().getEmail();
            if (userEmail != null && !userEmail.endsWith("@temp.com")) {
                emailService.sendAppointmentCompletedEmail(
                        userEmail,
                        appointment.getAppointmentCode(),
                        appointment.getDoctor().getFullName(),
                        appointment.getAppointmentDate().toString(),
                        appointment.getAppointmentTime().toString(),
                        appointment.getHospital() != null ? appointment.getHospital().getName() : ""
                );
            }
        } catch (Exception ex) {
            System.err.println("Failed to send appointment-completed email: " + ex.getMessage());
        }

        return convertToDTO(medicalRecordRepository.save(record));
    }

    private MedicalRecordDTO convertToDTO(MedicalRecord record) {
        return MedicalRecordDTO.builder()
                .id(record.getId())
                .appointmentId(record.getAppointment().getId())
                .userId(record.getUser().getId())
                .userName(record.getUser().getFullName())
                .doctorId(record.getDoctor().getId())
                .doctorName(record.getDoctor().getFullName())
                .symptoms(record.getSymptoms())
                .diagnosis(record.getDiagnosis())
                .treatmentPlan(record.getTreatmentPlan())
                .prescription(record.getPrescription())
                .note(record.getNote())
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .build();
    }
}
