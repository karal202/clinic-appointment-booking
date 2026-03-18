package com.clinic.booking.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class UploadController {

    private final Path uploadDir = Paths.get("uploads");

    @PostMapping("/uploads")
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                Map<String, String> err = new HashMap<>();
                err.put("message", "No file provided");
                return ResponseEntity.badRequest().body(err);
            }

            Files.createDirectories(uploadDir);
            String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
            String filename = System.currentTimeMillis() + "-" + UUID.randomUUID().toString() + "-" + original.replaceAll("[^a-zA-Z0-9.\\-_]", "_");
            Path target = uploadDir.resolve(filename).normalize();
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            Map<String, String> res = new HashMap<>();
            res.put("url", "/uploads/" + filename);
            return ResponseEntity.ok(res);
        } catch (Exception ex) {
            ex.printStackTrace();
            Map<String, String> err = new HashMap<>();
            err.put("message", "Failed to save file: " + ex.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }
}
