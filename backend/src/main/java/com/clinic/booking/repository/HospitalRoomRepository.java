package com.clinic.booking.repository;

import com.clinic.booking.entity.HospitalRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HospitalRoomRepository extends JpaRepository<HospitalRoom, Long> {
    List<HospitalRoom> findByHospitalId(Long hospitalId);
}
