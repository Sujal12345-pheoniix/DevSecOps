package com.devtrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Long id;
    private String message;
    private boolean readStatus;
    private String type;
    private LocalDateTime createdAt;
}
