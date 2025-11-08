import { Hono } from 'hono';
import { cors } from './middleware/cors';
import { logger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { testConnection, checkDatabaseHealth } from './config/database';
import { env } from './config/env';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import packageRoutes from './routes/package.routes';
import paymentRoutes from './routes/payment.routes';
import transactionRoutes from './routes/transaction.routes';

const app = new Hono();

// Apply middleware
app.use('*', cors());
app.use('*', logger);

// Health check endpoint
app.get('/health', async (c) => {
  const dbHealthy = await checkDatabaseHealth();

  return c.json({
    status: dbHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: dbHealthy ? 'connected' : 'disconnected',
  }, dbHealthy ? 200 : 503);
});

// API routes
app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/user', userRoutes);
app.route('/api/v1/leaderboard', leaderboardRoutes);
app.route('/api/v1/packages', packageRoutes);
app.route('/api/v1/payment', paymentRoutes);
app.route('/api/v1/transactions', transactionRoutes);

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
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);

    // Start the server
    Bun.serve({
      port,
      fetch: app.fetch,
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
