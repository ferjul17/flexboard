import type { Context } from 'hono';
import { sql } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { getUser } from '../middleware/auth';
import { getUserLeaderboardHistory } from '../services/leaderboard.service';

const DEFAULT_PAGE_SIZE = 50;

export async function getGlobalLeaderboard(c: Context) {
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || String(DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * pageSize;

  const leaderboard = await sql`
    WITH user_totals AS (
      SELECT
        user_id,
        SUM(flex_points) as total_flex_points,
        SUM(amount) as total_spent
      FROM transactions
      WHERE status = 'completed'
      GROUP BY user_id
    ),
    ranked_users AS (
      SELECT
        ut.user_id,
        ut.total_flex_points,
        ut.total_spent,
        u.username,
        ROW_NUMBER() OVER (ORDER BY ut.total_flex_points DESC) as rank
      FROM user_totals ut
      JOIN users u ON ut.user_id = u.id
    )
    SELECT * FROM ranked_users
    ORDER BY rank
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  const [{ count }] = await sql`
    SELECT COUNT(DISTINCT user_id) as count
    FROM transactions
    WHERE status = 'completed'
  `;

  return c.json({
    data: leaderboard.map((entry: any) => ({
      rank: parseInt(entry.rank),
      userId: entry.user_id,
      username: entry.username,
      totalFlexPoints: parseInt(entry.total_flex_points),
      totalSpent: parseFloat(entry.total_spent),
    })),
    pagination: {
      page,
      pageSize,
      total: parseInt(count),
      totalPages: Math.ceil(parseInt(count) / pageSize),
    },
  });
}

export async function getMonthlyLeaderboard(c: Context) {
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || String(DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * pageSize;

  const leaderboard = await sql`
    WITH user_totals AS (
      SELECT
        user_id,
        SUM(flex_points) as total_flex_points,
        SUM(amount) as total_spent
      FROM transactions
      WHERE status = 'completed'
        AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY user_id
    ),
    ranked_users AS (
      SELECT
        ut.user_id,
        ut.total_flex_points,
        ut.total_spent,
        u.username,
        ROW_NUMBER() OVER (ORDER BY ut.total_flex_points DESC) as rank
      FROM user_totals ut
      JOIN users u ON ut.user_id = u.id
    )
    SELECT * FROM ranked_users
    ORDER BY rank
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  const [{ count }] = await sql`
    SELECT COUNT(DISTINCT user_id) as count
    FROM transactions
    WHERE status = 'completed'
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
  `;

  return c.json({
    data: leaderboard.map((entry: any) => ({
      rank: parseInt(entry.rank),
      userId: entry.user_id,
      username: entry.username,
      totalFlexPoints: parseInt(entry.total_flex_points),
      totalSpent: parseFloat(entry.total_spent),
    })),
    pagination: {
      page,
      pageSize,
      total: parseInt(count),
      totalPages: Math.ceil(parseInt(count) / pageSize),
    },
  });
}

export async function getWeeklyLeaderboard(c: Context) {
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || String(DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * pageSize;

  const leaderboard = await sql`
    WITH user_totals AS (
      SELECT
        user_id,
        SUM(flex_points) as total_flex_points,
        SUM(amount) as total_spent
      FROM transactions
      WHERE status = 'completed'
        AND DATE_TRUNC('week', created_at) = DATE_TRUNC('week', CURRENT_DATE)
      GROUP BY user_id
    ),
    ranked_users AS (
      SELECT
        ut.user_id,
        ut.total_flex_points,
        ut.total_spent,
        u.username,
        ROW_NUMBER() OVER (ORDER BY ut.total_flex_points DESC) as rank
      FROM user_totals ut
      JOIN users u ON ut.user_id = u.id
    )
    SELECT * FROM ranked_users
    ORDER BY rank
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  const [{ count }] = await sql`
    SELECT COUNT(DISTINCT user_id) as count
    FROM transactions
    WHERE status = 'completed'
      AND DATE_TRUNC('week', created_at) = DATE_TRUNC('week', CURRENT_DATE)
  `;

  return c.json({
    data: leaderboard.map((entry: any) => ({
      rank: parseInt(entry.rank),
      userId: entry.user_id,
      username: entry.username,
      totalFlexPoints: parseInt(entry.total_flex_points),
      totalSpent: parseFloat(entry.total_spent),
    })),
    pagination: {
      page,
      pageSize,
      total: parseInt(count),
      totalPages: Math.ceil(parseInt(count) / pageSize),
    },
  });
}

export async function getRegionalLeaderboard(c: Context) {
  const region = c.req.query('region');
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || String(DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * pageSize;

  if (!region) {
    throw new AppError(400, 'Region parameter is required', 'REGION_REQUIRED');
  }

  // Note: This assumes users table has a 'region' column
  // This will be added in the database schema
  const leaderboard = await sql`
    WITH user_totals AS (
      SELECT
        t.user_id,
        SUM(t.flex_points) as total_flex_points,
        SUM(t.amount) as total_spent,
        u.region
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.status = 'completed' AND u.region = ${region}
      GROUP BY t.user_id, u.region
    ),
    ranked_users AS (
      SELECT
        ut.user_id,
        ut.total_flex_points,
        ut.total_spent,
        u.username,
        ROW_NUMBER() OVER (ORDER BY ut.total_flex_points DESC) as rank
      FROM user_totals ut
      JOIN users u ON ut.user_id = u.id
    )
    SELECT * FROM ranked_users
    ORDER BY rank
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  const [{ count }] = await sql`
    SELECT COUNT(DISTINCT t.user_id) as count
    FROM transactions t
    JOIN users u ON t.user_id = u.id
    WHERE t.status = 'completed' AND u.region = ${region}
  `;

  return c.json({
    data: leaderboard.map((entry: any) => ({
      rank: parseInt(entry.rank),
      userId: entry.user_id,
      username: entry.username,
      totalFlexPoints: parseInt(entry.total_flex_points),
      totalSpent: parseFloat(entry.total_spent),
    })),
    pagination: {
      page,
      pageSize,
      total: parseInt(count || 0),
      totalPages: Math.ceil(parseInt(count || 0) / pageSize),
    },
  });
}

/**
 * Get user's rank history for a specific leaderboard
 */
export async function getUserHistory(c: Context) {
  const { userId } = getUser(c);
  const leaderboardType = c.req.query('type') || 'global';
  const region = c.req.query('region');
  const limit = parseInt(c.req.query('limit') || '30');

  if (!['global', 'monthly', 'weekly', 'regional'].includes(leaderboardType)) {
    throw new AppError(400, 'Invalid leaderboard type', 'INVALID_LEADERBOARD_TYPE');
  }

  if (leaderboardType === 'regional' && !region) {
    throw new AppError(
      400,
      'Region parameter is required for regional leaderboard',
      'REGION_REQUIRED'
    );
  }

  const history = await getUserLeaderboardHistory(
    userId,
    leaderboardType as 'global' | 'monthly' | 'weekly' | 'regional',
    region,
    limit
  );

  return c.json({
    data: {
      leaderboardType,
      region,
      history,
    },
  });
}

/**
 * Get current user's rank in all leaderboards
 */
export async function getCurrentUserRank(c: Context) {
  const { userId } = getUser(c);

  // Get user's region
  const [user] = await sql`SELECT region, username FROM users WHERE id = ${userId}`;

  if (!user) {
    throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
  }

  // Get ranks for all leaderboard types
  const [globalRank, monthlyRank, weeklyRank, regionalRank] = await Promise.all([
    getUserRankInLeaderboard(userId, 'global'),
    getUserRankInLeaderboard(userId, 'monthly'),
    getUserRankInLeaderboard(userId, 'weekly'),
    user.region ? getUserRankInLeaderboard(userId, 'regional', user.region) : null,
  ]);

  return c.json({
    data: {
      username: user.username,
      global: globalRank,
      monthly: monthlyRank,
      weekly: weeklyRank,
      regional: regionalRank,
    },
  });
}

/**
 * Helper function to get user's rank in a specific leaderboard
 */
async function getUserRankInLeaderboard(
  userId: string,
  leaderboardType: 'global' | 'monthly' | 'weekly' | 'regional',
  region?: string
) {
  let whereClause = `WHERE t.status = 'completed'`;

  if (leaderboardType === 'monthly') {
    whereClause += ` AND DATE_TRUNC('month', t.created_at) = DATE_TRUNC('month', CURRENT_DATE)`;
  } else if (leaderboardType === 'weekly') {
    whereClause += ` AND DATE_TRUNC('week', t.created_at) = DATE_TRUNC('week', CURRENT_DATE)`;
  }

  if (region && leaderboardType === 'regional') {
    whereClause += ` AND u.region = '${region}'`;
  }

  const result = await sql.unsafe(`
    WITH user_totals AS (
      SELECT
        t.user_id,
        SUM(t.flex_points) as total_flex_points,
        SUM(t.amount) as total_spent
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ${whereClause}
      GROUP BY t.user_id
    ),
    ranked_users AS (
      SELECT
        ut.user_id,
        ut.total_flex_points,
        ut.total_spent,
        ROW_NUMBER() OVER (ORDER BY ut.total_flex_points DESC) as rank
      FROM user_totals ut
    )
    SELECT
      rank,
      total_flex_points,
      total_spent
    FROM ranked_users
    WHERE user_id = '${userId}'
  `);

  if (result.length === 0) {
    return null;
  }

  return {
    rank: parseInt(result[0].rank),
    totalFlexPoints: parseInt(result[0].total_flex_points),
    totalSpent: parseFloat(result[0].total_spent),
  };
}
