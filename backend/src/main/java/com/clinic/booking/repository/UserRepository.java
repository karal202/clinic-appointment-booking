package com.clinic.booking.repository;

import com.clinic.booking.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleId(String googleId);

    Optional<User> findByPhoneNumber(String phoneNumber);

    Boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.email = :email AND u.isActive = true")
    Optional<User> findActiveUserByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.otp = :otp AND u.email = :email")
    Optional<User> findByEmailAndOtp(@org.springframework.data.repository.query.Param("email") String email,
            @org.springframework.data.repository.query.Param("otp") String otp);
}
