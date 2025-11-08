import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import * as leaderboardController from '../controllers/leaderboard.controller';

const leaderboardRoutes = new Hono();

// All leaderboard routes require authentication
leaderboardRoutes.use('/*', authMiddleware);

leaderboardRoutes.get('/global', leaderboardController.getGlobalLeaderboard);
leaderboardRoutes.get('/monthly', leaderboardController.getMonthlyLeaderboard);
leaderboardRoutes.get('/weekly', leaderboardController.getWeeklyLeaderboard);
leaderboardRoutes.get('/regional', leaderboardController.getRegionalLeaderboard);

export default leaderboardRoutes;
