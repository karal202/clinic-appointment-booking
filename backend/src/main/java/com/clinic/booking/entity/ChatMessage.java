package com.clinic.booking.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "session_id", nullable = false)
    private ChatSession session;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('system','user','assistant','tool')")
    private MessageRole role;
    
    @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
    private String content;
    
    @Column(columnDefinition = "JSON")
    private String meta; // Store as JSON string
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    // Enum
    public enum MessageRole {
        @Column(columnDefinition = "ENUM('system','user','assistant','tool')")
        SYSTEM("system"),
        USER("user"),
        ASSISTANT("assistant"),
        TOOL("tool");
        
        private final String value;
        
        MessageRole(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
    }
}