import { Hono } from 'hono';
import { wsService } from '../services/websocket.service';
import { verifyAccessToken } from '../utils/jwt';
import type { ServerWebSocket } from 'bun';

const app = new Hono();

/**
 * WebSocket upgrade endpoint
 * Clients connect to ws://localhost:3000/ws/leaderboard
 */
app.get('/leaderboard', async (c) => {
  // Get token from query parameter or header
  const token = c.req.query('token') || c.req.header('Authorization')?.replace('Bearer ', '');

  let userId: string | undefined;

  // Verify token if provided (optional for public leaderboard viewing)
  if (token) {
    try {
      const payload = await verifyAccessToken(token);
      userId = payload.userId;
    } catch (_error) {
      console.log('Invalid token provided for WebSocket connection');
    }
  }

  // Upgrade to WebSocket
  const success = (c.env as any).server?.upgrade(c.req.raw, {
    data: { userId },
  });

  if (success) {
    return undefined; // Connection upgraded
  }

  return c.text('WebSocket upgrade failed', 400);
});

/**
 * WebSocket handlers for Bun server
 * These need to be passed to Bun.serve() in the main index.ts
 */
export const websocketHandlers = {
  open(ws: ServerWebSocket<{ userId?: string }>) {
    const clientId = wsService.registerClient(ws, ws.data.userId);
    (ws as any).clientId = clientId;

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: 'connected',
        clientId,
        authenticated: !!ws.data.userId,
        timestamp: new Date().toISOString(),
      })
    );
  },

  message(ws: ServerWebSocket<{ userId?: string }>, message: string | Buffer) {
    try {
      const data = JSON.parse(message.toString());
      const clientId = (ws as any).clientId;

      // Handle different message types
      switch (data.type) {
        case 'subscribe':
          wsService.subscribeToLeaderboard(clientId, data.leaderboardType, data.region);
          ws.send(
            JSON.stringify({
              type: 'subscribed',
              leaderboardType: data.leaderboardType,
              region: data.region,
              timestamp: new Date().toISOString(),
            })
          );
          break;

        case 'unsubscribe':
          wsService.unsubscribeFromLeaderboard(clientId, data.leaderboardType, data.region);
          ws.send(
            JSON.stringify({
              type: 'unsubscribed',
              leaderboardType: data.leaderboardType,
              region: data.region,
              timestamp: new Date().toISOString(),
            })
          );
          break;

        case 'ping':
          ws.send(
            JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString(),
            })
          );
          break;

        default:
          ws.send(
            JSON.stringify({
              type: 'error',
              message: 'Unknown message type',
              timestamp: new Date().toISOString(),
            })
          );
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
          timestamp: new Date().toISOString(),
        })
      );
    }
  },

  close(ws: ServerWebSocket<{ userId?: string }>) {
    const clientId = (ws as any).clientId;
    if (clientId) {
      wsService.unregisterClient(clientId);
    }
  },

  error(ws: ServerWebSocket<{ userId?: string }>, error: Error) {
    console.error('WebSocket error:', error);
  },
};

export default app;
