/**
 * WebSocket service for real-time leaderboard updates
 * Manages WebSocket connections and broadcasts rank changes
 */

import type { ServerWebSocket } from 'bun';

interface WebSocketClient {
  ws: ServerWebSocket<{ userId?: string }>;
  userId?: string;
  subscribedLeaderboards: Set<string>;
}

interface RankChangeNotification {
  type: 'rank_change';
  userId: string;
  leaderboardType: 'global' | 'monthly' | 'weekly' | 'regional';
  region?: string;
  oldRank?: number;
  newRank: number;
  rankChange: number;
  totalFlexPoints: number;
  timestamp: string;
}

interface LeaderboardUpdateNotification {
  type: 'leaderboard_update';
  leaderboardType: 'global' | 'monthly' | 'weekly' | 'regional';
  region?: string;
  affectedRanks: number[];
  timestamp: string;
}

class WebSocketService {
  private clients: Map<string, WebSocketClient> = new Map();

  /**
   * Register a new WebSocket client
   */
  registerClient(ws: ServerWebSocket<{ userId?: string }>, userId?: string): string {
    const clientId = crypto.randomUUID();

    this.clients.set(clientId, {
      ws,
      userId,
      subscribedLeaderboards: new Set(),
    });

    console.log(`📱 WebSocket client connected: ${clientId}${userId ? ` (User: ${userId})` : ''}`);
    console.log(`   Total clients: ${this.clients.size}`);

    return clientId;
  }

  /**
   * Unregister a WebSocket client
   */
  unregisterClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
      console.log(`📱 WebSocket client disconnected: ${clientId}`);
      console.log(`   Total clients: ${this.clients.size}`);
    }
  }

  /**
   * Subscribe a client to a specific leaderboard
   */
  subscribeToLeaderboard(
    clientId: string,
    leaderboardType: 'global' | 'monthly' | 'weekly' | 'regional',
    region?: string
  ) {
    const client = this.clients.get(clientId);
    if (client) {
      const leaderboardKey = region ? `${leaderboardType}:${region}` : leaderboardType;
      client.subscribedLeaderboards.add(leaderboardKey);
      console.log(`📊 Client ${clientId} subscribed to ${leaderboardKey}`);
    }
  }

  /**
   * Unsubscribe a client from a specific leaderboard
   */
  unsubscribeFromLeaderboard(
    clientId: string,
    leaderboardType: 'global' | 'monthly' | 'weekly' | 'regional',
    region?: string
  ) {
    const client = this.clients.get(clientId);
    if (client) {
      const leaderboardKey = region ? `${leaderboardType}:${region}` : leaderboardType;
      client.subscribedLeaderboards.delete(leaderboardKey);
      console.log(`📊 Client ${clientId} unsubscribed from ${leaderboardKey}`);
    }
  }

  /**
   * Broadcast a rank change notification to relevant clients
   */
  broadcastRankChange(notification: Omit<RankChangeNotification, 'type' | 'timestamp'>) {
    const message: RankChangeNotification = {
      type: 'rank_change',
      ...notification,
      timestamp: new Date().toISOString(),
    };

    const leaderboardKey = notification.region
      ? `${notification.leaderboardType}:${notification.region}`
      : notification.leaderboardType;

    let sentCount = 0;

    this.clients.forEach((client) => {
      // Send to the affected user if they're connected
      if (client.userId === notification.userId) {
        this.sendMessage(client.ws, message);
        sentCount++;
      }
      // Also send to clients subscribed to this leaderboard
      else if (client.subscribedLeaderboards.has(leaderboardKey)) {
        this.sendMessage(client.ws, message);
        sentCount++;
      }
    });

    console.log(
      `📢 Rank change broadcast: ${notification.userId} (${notification.leaderboardType}), sent to ${sentCount} clients`
    );
  }

  /**
   * Broadcast a general leaderboard update
   */
  broadcastLeaderboardUpdate(
    notification: Omit<LeaderboardUpdateNotification, 'type' | 'timestamp'>
  ) {
    const message: LeaderboardUpdateNotification = {
      type: 'leaderboard_update',
      ...notification,
      timestamp: new Date().toISOString(),
    };

    const leaderboardKey = notification.region
      ? `${notification.leaderboardType}:${notification.region}`
      : notification.leaderboardType;

    let sentCount = 0;

    this.clients.forEach((client) => {
      if (client.subscribedLeaderboards.has(leaderboardKey)) {
        this.sendMessage(client.ws, message);
        sentCount++;
      }
    });

    console.log(`📢 Leaderboard update broadcast: ${leaderboardKey}, sent to ${sentCount} clients`);
  }

  /**
   * Send a message to a specific user
   */
  sendToUser(userId: string, message: any) {
    let sentCount = 0;

    this.clients.forEach((client) => {
      if (client.userId === userId) {
        this.sendMessage(client.ws, message);
        sentCount++;
      }
    });

    return sentCount > 0;
  }

  /**
   * Send a message to all connected clients
   */
  broadcast(message: any) {
    this.clients.forEach((client) => {
      this.sendMessage(client.ws, message);
    });
  }

  /**
   * Send a message to a WebSocket client
   */
  private sendMessage(ws: ServerWebSocket<{ userId?: string }>, message: any) {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
    }
  }

  /**
   * Get the number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get the number of clients subscribed to a leaderboard
   */
  getLeaderboardSubscriberCount(
    leaderboardType: 'global' | 'monthly' | 'weekly' | 'regional',
    region?: string
  ): number {
    const leaderboardKey = region ? `${leaderboardType}:${region}` : leaderboardType;

    let count = 0;
    this.clients.forEach((client) => {
      if (client.subscribedLeaderboards.has(leaderboardKey)) {
        count++;
      }
    });

    return count;
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
