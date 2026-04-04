package com.clinic.booking.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import org.springframework.beans.factory.annotation.Value;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        List<String> allowedOrigins = new ArrayList<>(Arrays.asList(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:3000"
        ));

        if (frontendUrl != null && !frontendUrl.isEmpty()) {
            allowedOrigins.add(frontendUrl);
            if (frontendUrl.endsWith("/")) {
                allowedOrigins.add(frontendUrl.substring(0, frontendUrl.length() - 1));
            } else {
                allowedOrigins.add(frontendUrl + "/");
            }
        }

        registry.addEndpoint("/ws")
                .setAllowedOrigins(allowedOrigins.toArray(new String[0]))
                .withSockJS();
    }
}
