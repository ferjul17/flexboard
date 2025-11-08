import { sql } from '../config/database';

/**
 * Service for managing leaderboard operations including
 * history tracking, snapshots, and resets
 */

interface LeaderboardEntry {
  userId: string;
  username: string;
  rank: number;
  totalFlexPoints: number;
  totalSpent: number;
}

/**
 * Record a snapshot of user's current rank in history
 */
export async function recordUserRankHistory(
  userId: string,
  leaderboardType: 'global' | 'monthly' | 'weekly' | 'regional',
  region?: string
) {
  // Get user's current rank
  const currentRank = await getCurrentUserRank(userId, leaderboardType, region);

  if (!currentRank) {
    console.log(`User ${userId} not found in ${leaderboardType} leaderboard`);
    return;
  }

  // Get user's previous rank from history
  const previousEntry = await sql`
    SELECT rank
    FROM leaderboard_history
    WHERE user_id = ${userId}
      AND leaderboard_type = ${leaderboardType}
      AND (${region}::text IS NULL OR region = ${region})
    ORDER BY recorded_at DESC
    LIMIT 1
  `;

  const previousRank = previousEntry[0]?.rank;
  const rankChange = previousRank ? previousRank - currentRank.rank : null;

  // Insert new history entry
  await sql`
    INSERT INTO leaderboard_history (
      user_id,
      leaderboard_type,
      region,
      rank,
      total_flex_points,
      total_spent,
      rank_change
    ) VALUES (
      ${userId},
      ${leaderboardType},
      ${region || null},
      ${currentRank.rank},
      ${currentRank.totalFlexPoints},
      ${currentRank.totalSpent},
      ${rankChange}
    )
  `;

  return {
    currentRank: currentRank.rank,
    previousRank,
    rankChange,
  };
}

/**
 * Get current rank for a user in a specific leaderboard
 */
async function getCurrentUserRank(
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
        u.username,
        ROW_NUMBER() OVER (ORDER BY ut.total_flex_points DESC) as rank
      FROM user_totals ut
      JOIN users u ON ut.user_id = u.id
    )
    SELECT
      user_id,
      username,
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
    userId: result[0].user_id,
    username: result[0].username,
    rank: parseInt(result[0].rank),
    totalFlexPoints: parseInt(result[0].total_flex_points),
    totalSpent: parseFloat(result[0].total_spent),
  };
}

/**
 * Create a snapshot of the entire leaderboard
 */
export async function createLeaderboardSnapshot(
  leaderboardType: 'global' | 'monthly' | 'weekly' | 'regional',
  region?: string,
  topN = 100
) {
  let whereClause = `WHERE t.status = 'completed'`;
  let periodStart = null;
  let periodEnd = null;

  if (leaderboardType === 'monthly') {
    whereClause += ` AND DATE_TRUNC('month', t.created_at) = DATE_TRUNC('month', CURRENT_DATE)`;
    periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    periodEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  } else if (leaderboardType === 'weekly') {
    whereClause += ` AND DATE_TRUNC('week', t.created_at) = DATE_TRUNC('week', CURRENT_DATE)`;
    // Calculate week start (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    periodStart = new Date(now);
    periodStart.setDate(now.getDate() + diff);
    periodStart.setHours(0, 0, 0, 0);
    periodEnd = new Date(periodStart);
    periodEnd.setDate(periodStart.getDate() + 6);
    periodEnd.setHours(23, 59, 59, 999);
  }

  if (region && leaderboardType === 'regional') {
    whereClause += ` AND u.region = '${region}'`;
  }

  const leaderboard = await sql.unsafe(`
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
        u.username,
        ROW_NUMBER() OVER (ORDER BY ut.total_flex_points DESC) as rank
      FROM user_totals ut
      JOIN users u ON ut.user_id = u.id
    )
    SELECT * FROM ranked_users
    ORDER BY rank
    LIMIT ${topN}
  `);

  const snapshotData = leaderboard.map((entry: any) => ({
    rank: parseInt(entry.rank),
    userId: entry.user_id,
    username: entry.username,
    totalFlexPoints: parseInt(entry.total_flex_points),
    totalSpent: parseFloat(entry.total_spent),
  }));

  await sql`
    INSERT INTO leaderboard_snapshots (
      leaderboard_type,
      region,
      snapshot_data,
      period_start,
      period_end
    ) VALUES (
      ${leaderboardType},
      ${region || null},
      ${JSON.stringify(snapshotData)},
      ${periodStart},
      ${periodEnd}
    )
  `;

  return snapshotData;
}

/**
 * Reset monthly leaderboard and record the reset
 */
export async function resetMonthlyLeaderboard(region?: string) {
  console.log(`🔄 Resetting monthly leaderboard${region ? ` for region ${region}` : ''}...`);

  // Create snapshot before reset
  const snapshot = await createLeaderboardSnapshot('monthly', region, 100);

  // Get period information
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const periodStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
  const periodEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

  // Get top user information
  const topUser = snapshot.length > 0 ? snapshot[0] : null;

  // Record the reset
  await sql`
    INSERT INTO leaderboard_resets (
      leaderboard_type,
      region,
      period_start,
      period_end,
      top_user_id,
      top_user_points,
      total_participants
    ) VALUES (
      'monthly',
      ${region || null},
      ${periodStart},
      ${periodEnd},
      ${topUser?.userId || null},
      ${topUser?.totalFlexPoints || 0},
      ${snapshot.length}
    )
  `;

  console.log(`✅ Monthly leaderboard reset complete. Top user: ${topUser?.username || 'N/A'} with ${topUser?.totalFlexPoints || 0} points`);

  return {
    topUser,
    totalParticipants: snapshot.length,
    periodStart,
    periodEnd,
  };
}

/**
 * Reset weekly leaderboard and record the reset
 */
export async function resetWeeklyLeaderboard(region?: string) {
  console.log(`🔄 Resetting weekly leaderboard${region ? ` for region ${region}` : ''}...`);

  // Create snapshot before reset
  const snapshot = await createLeaderboardSnapshot('weekly', region, 100);

  // Get period information (last week)
  const now = new Date();
  const lastWeekEnd = new Date(now);
  lastWeekEnd.setDate(now.getDate() - now.getDay()); // Last Sunday
  lastWeekEnd.setHours(23, 59, 59, 999);

  const periodEnd = lastWeekEnd;
  const periodStart = new Date(lastWeekEnd);
  periodStart.setDate(lastWeekEnd.getDate() - 6);
  periodStart.setHours(0, 0, 0, 0);

  // Get top user information
  const topUser = snapshot.length > 0 ? snapshot[0] : null;

  // Record the reset
  await sql`
    INSERT INTO leaderboard_resets (
      leaderboard_type,
      region,
      period_start,
      period_end,
      top_user_id,
      top_user_points,
      total_participants
    ) VALUES (
      'weekly',
      ${region || null},
      ${periodStart},
      ${periodEnd},
      ${topUser?.userId || null},
      ${topUser?.totalFlexPoints || 0},
      ${snapshot.length}
    )
  `;

  console.log(`✅ Weekly leaderboard reset complete. Top user: ${topUser?.username || 'N/A'} with ${topUser?.totalFlexPoints || 0} points`);

  return {
    topUser,
    totalParticipants: snapshot.length,
    periodStart,
    periodEnd,
  };
}

/**
 * Get leaderboard history for a user
 */
export async function getUserLeaderboardHistory(
  userId: string,
  leaderboardType: 'global' | 'monthly' | 'weekly' | 'regional',
  region?: string,
  limit = 30
) {
  const history = await sql`
    SELECT
      rank,
      total_flex_points,
      total_spent,
      rank_change,
      recorded_at
    FROM leaderboard_history
    WHERE user_id = ${userId}
      AND leaderboard_type = ${leaderboardType}
      AND (${region}::text IS NULL OR region = ${region})
    ORDER BY recorded_at DESC
    LIMIT ${limit}
  `;

  return history.map((entry: any) => ({
    rank: parseInt(entry.rank),
    totalFlexPoints: parseInt(entry.total_flex_points),
    totalSpent: parseFloat(entry.total_spent),
    rankChange: entry.rank_change ? parseInt(entry.rank_change) : null,
    recordedAt: entry.recorded_at,
  }));
}
