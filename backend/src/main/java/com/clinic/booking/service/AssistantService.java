package com.clinic.booking.service;

import com.clinic.booking.dto.AssistantRequest;
import com.clinic.booking.dto.AssistantResponse;
import com.clinic.booking.entity.Doctor;
import com.clinic.booking.entity.Specialty;
import com.clinic.booking.repository.DoctorRepository;
import com.clinic.booking.repository.SpecialtyRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssistantService {

    private final DoctorRepository doctorRepository;
    private final SpecialtyRepository specialtyRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${groq.model:llama-3.3-70b-versatile}")
    private String groqModel;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

    public AssistantResponse askAssistant(AssistantRequest request) {
        if (groqApiKey == null || groqApiKey.isEmpty()) {
            return AssistantResponse.builder()
                    .response("Tính năng trợ lý AI hiện chưa được cấu hình API Key. Vui lòng liên hệ quản trị viên.")
                    .build();
        }

        try {
            List<Map<String, String>> messages = new ArrayList<>();

            // System Prompt with Data Context
            String systemContext = buildSystemContext();
            messages.add(Map.of("role", "system", "content", systemContext));

            // History
            if (request.getHistory() != null) {
                for (AssistantRequest.ChatMessage historyItem : request.getHistory()) {
                    messages.add(Map.of("role", historyItem.getRole(), "content", historyItem.getContent()));
                }
            }

            // Current message
            messages.add(Map.of("role", "user", "content", request.getMessage()));

            Map<String, Object> body = new HashMap<>();
            body.put("model", groqModel);
            body.put("messages", messages);
            body.put("temperature", 0.7);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            String responseStr = restTemplate.postForObject(GROQ_API_URL, entity, String.class);
            JsonNode root = objectMapper.readTree(responseStr);
            String aiResponse = root.path("choices").get(0).path("message").path("content").asText();

            return AssistantResponse.builder().response(aiResponse).build();
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("API Error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return AssistantResponse.builder()
                    .response("Lỗi API (Groq): " + e.getStatusCode() + ". " + e.getResponseBodyAsString())
                    .build();
        } catch (Exception e) {
            log.error("Error calling Groq API", e);
            return AssistantResponse.builder()
                    .response("Lỗi hệ thống: " + e.getMessage())
                    .build();
        }
    }

    private String buildSystemContext() {
        List<Doctor> doctors = doctorRepository.findByIsActiveTrueAndIsAvailableForBookingTrue();
        List<Specialty> specialties = specialtyRepository.findByIsActiveTrue();

        StringBuilder sb = new StringBuilder();
        sb.append("Bạn là một trợ lý y tế thông minh cho nền tảng 'clinic-booking'.\n");
        sb.append("Nhiệm vụ của bạn là giúp người dùng tìm bác sĩ và chuyên khoa phù hợp.\n");
        sb.append("Dưới đây là thông tin về các chuyên khoa và bác sĩ đang có trên hệ thống:\n\n");

        sb.append("### Chuyên khoa:\n");
        for (Specialty s : specialties) {
            sb.append("- ").append(s.getName()).append(": ").append(s.getDescription()).append("\n");
        }

        sb.append("\n### Danh sách Bác sĩ:\n");
        for (Doctor d : doctors) {
            sb.append("- Bác sĩ: ").append(d.getFullName()).append("\n");
            sb.append("  Chuyên khoa: ").append(d.getSpecialty() != null ? d.getSpecialty().getName() : "N/A")
                    .append("\n");
            sb.append("  Bệnh viện: ").append(d.getHospital() != null ? d.getHospital().getName() : "N/A").append("\n");
            sb.append("  Kinh nghiệm: ")
                    .append(d.getBio() != null ? d.getBio() : "Rất giàu kinh nghiệm").append("\n");
            sb.append("  Link đặt lịch: ").append(frontendUrl).append("/doctors/").append(d.getId()).append("\n\n");
        }

        sb.append("\nQUY TẮC PHẢN HỒI:\n");
        sb.append("1. Luôn trả lời bằng Tiếng Việt lịch sự, thân thiện.\n");
        sb.append(
                "2. Nếu người dùng hỏi về bệnh lý, hãy dựa vào mô tả chuyên khoa hoặc bác sĩ để tư vấn họ nên khám bác sĩ nào.\n");
        sb.append(
                "3. Khi giới thiệu bác sĩ, HÃY KÈM THEO 'Link đặt lịch' đã cung cấp ở trên để người dùng có thể nhấn vào.\n");
        sb.append("4. Nếu không tìm thấy bác sĩ phù hợp, hãy khuyên họ đến chuyên khoa tương ứng.\n");
        sb.append(
                "5. Luôn nhắc nhở người dùng rằng tư vấn của AI chỉ mang tính tham khảo, họ nên gặp bác sĩ để có chẩn đoán chính xác.\n");
        sb.append("6. Trình bày phản hồi bằng Markdown để dễ đọc.");

        return sb.toString();
    }
}
