package com.devtrack.service;

import com.devtrack.dto.NotificationResponse;
import com.devtrack.exception.ResourceNotFoundException;
import com.devtrack.model.Notification;
import com.devtrack.model.NotificationType;
import com.devtrack.model.User;
import com.devtrack.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Transactional
    public Notification createNotification(User user, String message, NotificationType type) {
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .readStatus(false)
                .type(type)
                .build();
        return notificationRepository.save(notification);
    }

    public List<NotificationResponse> getNotificationsByUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<NotificationResponse> getUnreadNotificationsByUser(Long userId) {
        return notificationRepository.findByUserIdAndReadStatusOrderByCreatedAtDesc(userId, false).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadStatus(userId, false);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));
        notification.setReadStatus(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadStatusOrderByCreatedAtDesc(userId, false);
        unread.forEach(n -> n.setReadStatus(true));
        notificationRepository.saveAll(unread);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .readStatus(notification.isReadStatus())
                .type(notification.getType().name())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
