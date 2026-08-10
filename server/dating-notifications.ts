import crypto from 'crypto';
import { Router } from 'express';
import { db } from './db';
import { datingNotifications, datingMatches, datingMessages, users } from '../drizzle/schema';
import { eq, desc, count } from 'drizzle-orm';

const router = Router();

// WebSocket notification types
export type NotificationType = 'match' | 'message' | 'superlike' | 'like' | 'profile_view' | 'message_read';

export interface DatingNotification {
  id: string;
  userId: string;
  type: NotificationType;
  fromUserId: string;
  matchId?: string;
  messageId?: string;
  title: string;
  content: string;
  read: boolean;
  createdAt: Date;
  actionUrl: string;
}

// Create notification
export async function createNotification(
  userId: string,
  type: NotificationType,
  fromUserId: string,
  data: {
    matchId?: string;
    messageId?: string;
    title: string;
    content: string;
    actionUrl: string;
  }
): Promise<DatingNotification> {
  const notification = {
    id: `notif_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substr(2, 9)}`,
    userId,
    type,
    fromUserId,
    matchId: data.matchId,
    messageId: data.messageId,
    title: data.title,
    content: data.content,
    read: false,
    createdAt: new Date(),
    actionUrl: data.actionUrl,
  };

  // Store in database
  await db.insert(datingNotifications).values(notification);

  // Broadcast to WebSocket clients
  broadcastNotification(userId, notification);

  return notification;
}

// Get user notifications
router.get('/api/dating/notifications', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const notifications = await db
      .select()
      .from(datingNotifications)
      .where(eq(datingNotifications.userId, userId))
      .orderBy(desc(datingNotifications.createdAt))
      .limit(50);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/api/dating/notifications/:id/read', async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await db
      .update(datingNotifications)
      .set({ read: true })
      .where(eq(datingNotifications.id, id));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all as read
router.patch('/api/dating/notifications/mark-all-read', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await db
      .update(datingNotifications)
      .set({ read: true })
      .where(eq(datingNotifications.userId, userId));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Delete notification
router.delete('/api/dating/notifications/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await db
      .delete(datingNotifications)
      .where(eq(datingNotifications.id, id));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Get unread count
router.get('/api/dating/notifications/unread/count', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const notifications = await db
      .select()
      .from(datingNotifications)
      .where(eq(datingNotifications.userId, userId));

    res.json({ unreadCount: notifications.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Get notification preferences
router.get('/api/dating/notifications/preferences', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const preferences = {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      matchNotifications: true,
      messageNotifications: true,
      superlikeNotifications: true,
      profileViewNotifications: false,
      soundEnabled: true,
      vibrationEnabled: true,
    };

    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Update notification preferences
router.patch('/api/dating/notifications/preferences', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { preferences } = req.body;

    
    res.json({ success: true, preferences });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// WebSocket client management
const wsClients = new Map<string, any[]>();

export function registerWebSocketClient(userId: string, ws: any) {
  if (!wsClients.has(userId)) {
    wsClients.set(userId, []);
  }
  wsClients.get(userId)!.push(ws);
}

export function unregisterWebSocketClient(userId: string, ws: any) {
  const clients = wsClients.get(userId);
  if (clients) {
    const index = clients.indexOf(ws);
    if (index > -1) {
      clients.splice(index, 1);
    }
  }
}

export function broadcastNotification(userId: string, notification: DatingNotification) {
  const clients = wsClients.get(userId);
  if (clients) {
    clients.forEach((ws) => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(JSON.stringify({
          type: 'notification',
          data: notification,
        }));
      }
    });
  }
}

// Trigger notifications for different events
export async function notifyMatch(user1Id: string, user2Id: string, matchId: string) {
  const [user1] = await db.select().from(users).where(eq(users.id, user1Id)).limit(1);
  const [user2] = await db.select().from(users).where(eq(users.id, user2Id)).limit(1);

  if (user1 && user2) {
    await createNotification(user1Id, 'match', user2Id, {
      matchId,
      title: '🎉 New Match!',
      content: `You matched with ${user2.name || 'someone'}!`,
      actionUrl: `/dating/messages/${matchId}`,
    });

    await createNotification(user2Id, 'match', user1Id, {
      matchId,
      title: '🎉 New Match!',
      content: `You matched with ${user1.name || 'someone'}!`,
      actionUrl: `/dating/messages/${matchId}`,
    });
  }
}

export async function notifyMessage(recipientId: string, senderId: string, messageId: string, content: string) {
  const [sender] = await db.select().from(users).where(eq(users.id, senderId)).limit(1);

  if (sender) {
    await createNotification(recipientId, 'message', senderId, {
      messageId,
      title: `💬 Message from ${sender.name || 'someone'}`,
      content: content.substring(0, 100),
      actionUrl: `/dating/messages`,
    });
  }
}

export async function notifySuperlike(recipientId: string, senderId: string) {
  const [sender] = await db.select().from(users).where(eq(users.id, senderId)).limit(1);

  if (sender) {
    await createNotification(recipientId, 'superlike', senderId, {
      title: '⭐ Super Like!',
      content: `${sender.name || 'Someone'} super liked you!`,
      actionUrl: `/dating`,
    });
  }
}

export async function notifyLike(recipientId: string, senderId: string) {
  const [sender] = await db.select().from(users).where(eq(users.id, senderId)).limit(1);

  if (sender) {
    await createNotification(recipientId, 'like', senderId, {
      title: '❤️ New Like',
      content: `${sender.name || 'Someone'} liked you!`,
      actionUrl: `/dating`,
    });
  }
}

export async function notifyProfileView(recipientId: string, viewerId: string) {
  const [viewer] = await db.select().from(users).where(eq(users.id, viewerId)).limit(1);

  if (viewer) {
    await createNotification(recipientId, 'profile_view', viewerId, {
      title: '👀 Profile View',
      content: `${viewer.name || 'Someone'} viewed your profile!`,
      actionUrl: `/dating`,
    });
  }
}

export default router;
