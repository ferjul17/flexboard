import { Hono } from 'hono';
import { cors } from './middleware/cors';
import { logger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { testConnection, checkDatabaseHealth } from './config/database';
import { env } from './config/env';
import { scheduler } from './services/scheduler.service';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import packageRoutes from './routes/package.routes';
import paymentRoutes from './routes/payment.routes';
import transactionRoutes from './routes/transaction.routes';
import websocketRoutes, { websocketHandlers } from './routes/websocket.routes';

const app = new Hono();

// Apply middleware
app.use('*', cors());
app.use('*', logger);

// Health check endpoint
app.get('/health', async (c) => {
  const dbHealthy = await checkDatabaseHealth();

  return c.json(
    {
      status: dbHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database: dbHealthy ? 'connected' : 'disconnected',
    },
    dbHealthy ? 200 : 503
  );
});

// API routes
app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/user', userRoutes);
app.route('/api/v1/leaderboard', leaderboardRoutes);
app.route('/api/v1/packages', packageRoutes);
app.route('/api/v1/payment', paymentRoutes);
app.route('/api/v1/transactions', transactionRoutes);
app.route('/ws', websocketRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError(errorHandler);

// Start server
const port = parseInt(env.PORT);

async function startServer() {
  try {
    // Test database connection
    await testConnection();

    // Start scheduler service for leaderboard resets
    scheduler.start();

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              🎯 FLEXBOARD BACKEND API 🎯                  ║
║                                                           ║
║  Environment: ${env.NODE_ENV.padEnd(43)}║
║  Port:        ${port.toString().padEnd(43)}║
║  Version:     0.1.0${' '.repeat(36)}║
║                                                           ║
║  Server is running at http://localhost:${port}${' '.repeat(14)}║
║  WebSocket:   ws://localhost:${port}/ws${' '.repeat(17)}║
║  Scheduler:   Active${' '.repeat(35)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);

    // Start the server with WebSocket support
    Bun.serve({
      port,
      fetch: app.fetch,
      websocket: websocketHandlers,
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing server');
      scheduler.stop();
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing server');
      scheduler.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

void startServer();

export default app;
