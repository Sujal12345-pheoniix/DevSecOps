package com.devtrack.repository;

import com.devtrack.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Notification> findByUserIdAndReadStatusOrderByCreatedAtDesc(Long userId, boolean readStatus);
    long countByUserIdAndReadStatus(Long userId, boolean readStatus);
}
