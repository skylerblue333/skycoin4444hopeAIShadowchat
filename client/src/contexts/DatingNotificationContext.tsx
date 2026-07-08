import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/_core/hooks/useAuth';

export interface DatingNotification {
  id: number;
  userId: number;
  type: 'match' | 'message' | 'superlike' | 'like' | 'profile_view' | 'message_read';
  content: string;
  relatedUserId?: number;
  relatedUserName?: string;
  relatedUserImage?: string;
  readAt?: string;
  createdAt: string;
}

interface DatingNotificationContextType {
  notifications: DatingNotification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (notificationId: number) => Promise<void>;
  clearNotifications: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
}

const DatingNotificationContext = createContext<DatingNotificationContextType | undefined>(undefined);

// Fallback context for when WebSocket is unavailable
const defaultContext: DatingNotificationContextType = {
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  markAsRead: async () => {},
  clearNotifications: async () => {},
  deleteNotification: async () => {},
};

export function DatingNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<DatingNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/dating/notifications/ws`;

  const { isConnected: wsConnected, send } = useWebSocket({
    url: wsUrl,
    onConnect: () => {
            setIsConnected(true);
      // Send auth message first
      if (user?.id) {
        send({
          type: 'auth',
          data: { userId: user.id },
          timestamp: new Date().toISOString(),
        });
        // Then request to load existing notifications
        setTimeout(() => {
          send({
            type: 'load_notifications',
            data: { userId: user.id },
            timestamp: new Date().toISOString(),
          });
        }, 500);
      }
    },
    onDisconnect: () => {
            setIsConnected(false);
    },
    onMessage: (message) => {
      if (message.type === 'notification') {
        setNotifications((prev) => [message.data, ...prev]);
      } else if (message.type === 'notifications_loaded') {
        setNotifications(message.data || []);
      } else if (message.type === 'notification_read') {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === message.data.notificationId
              ? { ...n, readAt: new Date().toISOString() }
              : n
          )
        );
      }
    },
    onError: (error) => {
            // Don't block rendering on WebSocket error
    },
    autoReconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await fetch(`/api/dating/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, readAt: new Date().toISOString() }
            : n
        )
      );
    } catch (error) {
          }
  }, []);

  const clearNotifications = useCallback(async () => {
    try {
      await fetch('/api/dating/notifications/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      setNotifications([]);
    } catch (error) {
          }
  }, []);

  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      await fetch(`/api/dating/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
          }
  }, []);

  const value: DatingNotificationContextType = {
    notifications,
    unreadCount,
    isConnected: wsConnected,
    markAsRead,
    clearNotifications,
    deleteNotification,
  };

  return (
    <DatingNotificationContext.Provider value={value}>
      {children}
    </DatingNotificationContext.Provider>
  );
}

export function useDatingNotifications() {
  const context = useContext(DatingNotificationContext);
  if (!context) {
    // Return default context instead of throwing error
    return defaultContext;
  }
  return context;
}
