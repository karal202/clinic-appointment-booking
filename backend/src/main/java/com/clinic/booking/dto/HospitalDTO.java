package com.clinic.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HospitalDTO {
	private Long id;
	private String name;
	private String address;
	private String phone;
	private String imageUrl;
	private String details;
	private List<String> rooms;
	private List<SpecialtyDTO> specialties;
	private List<DoctorSummaryDTO> doctors;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}
