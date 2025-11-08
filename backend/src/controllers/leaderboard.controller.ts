import { Context } from 'hono';
import { sql } from '../config/database';
import { AppError } from '../middleware/errorHandler';

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
