package com.clinic.booking.controller;

import com.clinic.booking.dto.AssistantRequest;
import com.clinic.booking.dto.AssistantResponse;
import com.clinic.booking.service.AssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/assistant")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AssistantController {

    private final AssistantService assistantService;

    @PostMapping("/ask")
    public ResponseEntity<AssistantResponse> ask(@RequestBody AssistantRequest request) {
        return ResponseEntity.ok(assistantService.askAssistant(request));
    }
}
