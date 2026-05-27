import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import API from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const { user } = useAuth();
  const pollingRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await API.get('/notifications');
      setNotifications(response.data);
      const countResponse = await API.get('/notifications/unread-count');
      setUnreadCount(countResponse.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readStatus: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, readStatus: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const triggerToast = (message, type = 'INFO') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  // Poll for notifications every 5 seconds (simulates web socket/SSE updates in a simple and robust way)
  useEffect(() => {
    if (user) {
      fetchNotifications();
      pollingRef.current = setInterval(() => {
        fetchNotifications();
      }, 5000);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [user]);

  // Watch notifications length and trigger toast for new ones that are unread
  const prevNotificationsCountRef = useRef(0);
  useEffect(() => {
    const unread = notifications.filter(n => !n.readStatus);
    if (notifications.length > 0 && unread.length > 0) {
      // Find new notifications that were not in our previous records
      const latest = notifications[0];
      if (latest && !latest.readStatus && latest.createdAt) {
        // Only trigger toast if it is a fresh notification (less than 10s old) to avoid spam on page load
        const elapsedMs = Date.now() - new Date(latest.createdAt).getTime();
        // Since local times might differ, check if notifications count increased
        if (notifications.length > prevNotificationsCountRef.current && elapsedMs < 20000) {
          triggerToast(latest.message, latest.type);
        }
      }
    }
    prevNotificationsCountRef.current = notifications.length;
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        triggerToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
