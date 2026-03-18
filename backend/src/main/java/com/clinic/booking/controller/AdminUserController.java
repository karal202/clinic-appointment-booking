package com.clinic.booking.controller;

import com.clinic.booking.entity.User;
import com.clinic.booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listUsers(@RequestParam(required = false) Boolean includeDeleted) {
        List<com.clinic.booking.entity.User> all = userRepository.findAll();
        List<com.clinic.booking.entity.User> filtered = (includeDeleted != null && includeDeleted) ? all :
                all.stream().filter(u -> !Boolean.TRUE.equals(u.getDeleted())).collect(Collectors.toList());

        List<Map<String, Object>> users = filtered.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("email", u.getEmail());
            m.put("fullName", u.getFullName());
            m.put("phoneNumber", u.getPhoneNumber());
            m.put("role", u.getRole());
            m.put("isActive", u.getIsActive());
            m.put("deleted", u.getDeleted());
            m.put("createdAt", u.getCreatedAt());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String fullName = body.getOrDefault("fullName", "");
        String phone = body.getOrDefault("phoneNumber", "");
        String password = body.get("password");
        String role = body.getOrDefault("role", "USER");

        if (email == null || email.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        if (password == null || password.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required for new users");

        if (userRepository.existsByEmail(email))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User with this email already exists");

        User u = new User();
        u.setEmail(email.trim());
        u.setFullName(fullName.isBlank() ? email.split("@")[0] : fullName.trim());
        u.setPhoneNumber(phone);
        u.setPassword(passwordEncoder.encode(password));
        try {
            u.setRole(User.Role.valueOf(role.toUpperCase()));
        } catch (Exception ex) {
            u.setRole(User.Role.USER);
        }
        u.setIsActive(true);
        u.setEmailVerified(true);

        User saved = userRepository.save(u);

        Map<String, Object> resp = new HashMap<>();
        resp.put("id", saved.getId());
        resp.put("email", saved.getEmail());
        resp.put("fullName", saved.getFullName());
        resp.put("phoneNumber", saved.getPhoneNumber());
        resp.put("role", saved.getRole());
        resp.put("isActive", saved.getIsActive());
        resp.put("createdAt", saved.getCreatedAt());

        return ResponseEntity.ok(resp);
    }

    @PatchMapping("/{id}/lock")
    public ResponseEntity<Void> lockUser(@PathVariable Long id, @RequestParam(required = false) Boolean active) {
        User u = userRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        boolean newActive = active != null ? active : false;
        u.setIsActive(newActive);
        userRepository.save(u);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, @RequestParam(required = false) Boolean hard) {
        User u = userRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        boolean doHard = hard != null && hard;
        if (doHard) {
            userRepository.deleteById(id);
        } else {
            u.setDeleted(true);
            u.setIsActive(false);
            userRepository.save(u);
        }
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        User u = userRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String email = body.get("email") != null ? body.get("email").toString() : null;
        if (email != null && !email.isBlank() && !email.equalsIgnoreCase(u.getEmail())) {
            if (userRepository.existsByEmail(email)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
            }
            u.setEmail(email.trim());
        }

        String fullName = body.get("fullName") != null ? body.get("fullName").toString() : null;
        if (fullName != null) u.setFullName(fullName.trim());

        String phone = body.get("phoneNumber") != null ? body.get("phoneNumber").toString() : null;
        if (phone != null) u.setPhoneNumber(phone);

        String role = body.get("role") != null ? body.get("role").toString() : null;
        if (role != null) {
            try {
                u.setRole(User.Role.valueOf(role.toUpperCase()));
            } catch (Exception ex) { /* ignore invalid role */ }
        }

        Boolean isActive = body.get("isActive") != null ? Boolean.valueOf(body.get("isActive").toString()) : null;
        if (isActive != null) u.setIsActive(isActive);

        String password = body.get("password") != null ? body.get("password").toString() : null;
        if (password != null && !password.isBlank()) {
            u.setPassword(passwordEncoder.encode(password));
        }

        User saved = userRepository.save(u);

        Map<String, Object> resp = new HashMap<>();
        resp.put("id", saved.getId());
        resp.put("email", saved.getEmail());
        resp.put("fullName", saved.getFullName());
        resp.put("phoneNumber", saved.getPhoneNumber());
        resp.put("role", saved.getRole());
        resp.put("isActive", saved.getIsActive());
        resp.put("createdAt", saved.getCreatedAt());

        return ResponseEntity.ok(resp);
    }
}
