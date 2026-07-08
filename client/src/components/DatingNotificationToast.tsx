import React, { useEffect, useState } from 'react';
import { Heart, Zap, MessageCircle, Eye, Check } from 'lucide-react';
import { useDatingNotifications, DatingNotification } from '@/contexts/DatingNotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

export function DatingNotificationToast() {
  const { notifications, markAsRead } = useDatingNotifications();
  const [displayedNotifications, setDisplayedNotifications] = useState<DatingNotification[]>([]);

  useEffect(() => {
    // Show only unread notifications
    const unreadNotifications = notifications.filter((n) => !n.readAt).slice(0, 3);
    setDisplayedNotifications(unreadNotifications);
  }, [notifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'superlike':
        return <Zap className="w-5 h-5 text-purple-500" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'profile_view':
        return <Eye className="w-5 h-5 text-green-500" />;
      case 'message_read':
        return <Check className="w-5 h-5 text-gray-500" />;
      default:
        return <Heart className="w-5 h-5 text-pink-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'match':
        return 'bg-red-50 border-red-200';
      case 'superlike':
        return 'bg-purple-50 border-purple-200';
      case 'message':
        return 'bg-blue-50 border-blue-200';
      case 'profile_view':
        return 'bg-green-50 border-green-200';
      case 'message_read':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-pink-50 border-pink-200';
    }
  };

  const handleNotificationClick = (notification: DatingNotification) => {
    markAsRead(notification.id);
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {displayedNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            onClick={() => handleNotificationClick(notification)}
            className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-lg transition-shadow ${getNotificationColor(
              notification.type
            )}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">
                  {notification.relatedUserName || 'Someone'}
                </p>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {notification.content}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(notification.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {notification.relatedUserImage && (
                <img
                  src={notification.relatedUserImage}
                  alt={notification.relatedUserName}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
