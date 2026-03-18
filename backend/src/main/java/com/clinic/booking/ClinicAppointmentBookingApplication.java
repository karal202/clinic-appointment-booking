package com.clinic.booking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ClinicAppointmentBookingApplication {

	public static void main(String[] args) {
		SpringApplication.run(ClinicAppointmentBookingApplication.class, args);
	}

}
