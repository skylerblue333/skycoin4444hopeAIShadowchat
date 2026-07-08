import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { db } from './db';
import { datingNotifications, datingMatches } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

interface WebSocketClient {
  ws: WebSocket;
  userId: number;
  isAlive: boolean;
}

const clients = new Map<number, WebSocketClient[]>();

export function setupWebSocketServer(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    
    let userId: number | null = null;

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'auth') {
          userId = message.data.userId;
          if (userId && !clients.has(userId)) {
            clients.set(userId, []);
          }
          if (userId) {
            clients.get(userId)!.push({ ws, userId, isAlive: true });
          }
          
          ws.send(
            JSON.stringify({
              type: 'auth_success',
              data: { userId },
              timestamp: new Date().toISOString(),
            })
          );
        } else if (message.type === 'load_notifications' && userId) {
          // Load existing notifications
          const notifications = await db
            .select()
            .from(datingNotifications)
            .where(eq(datingNotifications.userId, userId as number))
            .orderBy((t) => t.createdAt)
            .limit(50);

          ws.send(
            JSON.stringify({
              type: 'notifications_loaded',
              data: notifications,
              timestamp: new Date().toISOString(),
            })
          );
        } else if (message.type === 'mark_read' && userId) {
          const { notificationId } = message.data;
          await db
            .update(datingNotifications)
            .set({ read: true })
            .where(eq(datingNotifications.id, notificationId));

          ws.send(
            JSON.stringify({
              type: 'notification_read',
              data: { notificationId },
              timestamp: new Date().toISOString(),
            })
          );
        } else if (message.type === 'ping') {
          ws.send(
            JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString(),
            })
          );
        }
      } catch (error) {
              }
    });

    ws.on('pong', () => {
      if (userId && clients.has(userId)) {
        const userClients = clients.get(userId)!;
        const client = userClients.find((c) => c.ws === ws);
        if (client) {
          client.isAlive = true;
        }
      }
    });

    ws.on('close', () => {
      if (userId && clients.has(userId)) {
        const userClients = clients.get(userId)!;
        const index = userClients.findIndex((c) => c.ws === ws);
        if (index > -1) {
          userClients.splice(index, 1);
        }
        if (userClients.length === 0) {
          clients.delete(userId);
        }
      }
          });

    ws.on('error', (error) => {
          });
  });

  // Heartbeat to detect dead connections
  const heartbeatInterval = setInterval(() => {
    clients.forEach((userClients) => {
      userClients.forEach((client) => {
        if (!client.isAlive) {
          client.ws.terminate();
          return;
        }
        client.isAlive = false;
        client.ws.ping();
      });
    });
  }, 30000);

  // Cleanup on server close
  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });
}

export async function broadcastNotification(
  userId: number,
  notification: {
    type: 'match' | 'message' | 'superlike' | 'like' | 'profile_view' | 'message_read';
    content: string;
    relatedUserId?: number;
    relatedUserName?: string;
    relatedUserImage?: string;
  }
) {
  const userClients = clients.get(userId);
  if (!userClients || userClients.length === 0) {
        return;
  }

  const message = JSON.stringify({
    type: 'notification',
    data: {
      ...notification,
      createdAt: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  });

  userClients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });

  }

export async function broadcastMatch(
  userId1: number,
  userId2: number,
  matchType: 'like' | 'superlike' | 'mutual_like' | 'mutual_superlike'
) {
  const isMutual = matchType.startsWith('mutual_');

  if (isMutual) {
    // Send to both users
    await broadcastNotification(userId1, {
      type: 'match',
      content: 'You have a new mutual match!',
      relatedUserId: userId2,
    });

    await broadcastNotification(userId2, {
      type: 'match',
      content: 'You have a new mutual match!',
      relatedUserId: userId1,
    });
  } else {
    // Send only to the recipient
    const recipientId = userId2;
    await broadcastNotification(recipientId, {
      type: matchType === 'superlike' ? 'superlike' : 'like',
      content: matchType === 'superlike' ? 'Someone super liked you!' : 'Someone liked you!',
      relatedUserId: userId1,
    });
  }
}

export async function broadcastMessage(
  matchId: number,
  senderId: number,
  recipientId: number,
  content: string
) {
  await broadcastNotification(recipientId, {
    type: 'message',
    content: `New message: ${content.substring(0, 50)}...`,
    relatedUserId: senderId,
  });
}

export async function broadcastProfileView(viewerId: number, profileOwnerId: number) {
  await broadcastNotification(profileOwnerId, {
    type: 'profile_view',
    content: 'Someone viewed your profile',
    relatedUserId: viewerId,
  });
}

export async function broadcastMessageRead(
  matchId: number,
  senderId: number,
  readerId: number
) {
  await broadcastNotification(senderId, {
    type: 'message_read',
    content: 'Your message was read',
    relatedUserId: readerId,
  });
}
