import { Context } from 'hono';
import { getUser } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { sql } from '../config/database';

const DEFAULT_PAGE_SIZE = 20;

/**
 * Get user's transaction history
 */
export async function getTransactions(c: Context) {
  const { userId } = getUser(c);
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || String(DEFAULT_PAGE_SIZE));
  const status = c.req.query('status'); // Optional filter by status
  const offset = (page - 1) * pageSize;

  let whereClause = sql`WHERE t.user_id = ${userId}`;

  if (status) {
    whereClause = sql`WHERE t.user_id = ${userId} AND t.status = ${status}`;
  }

  // Get transactions
  const transactions = await sql`
    SELECT
      t.id,
      t.package_id,
      t.amount,
      t.flex_points,
      t.status,
      t.payment_method,
      t.payment_id,
      t.created_at,
      t.updated_at,
      p.name as package_name,
      p.bonus_percentage
    FROM transactions t
    JOIN packages p ON t.package_id = p.id
    ${whereClause}
    ORDER BY t.created_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  // Get total count
  const [{ count }] = await sql`
    SELECT COUNT(*) as count
    FROM transactions t
    ${whereClause}
  `;

  return c.json({
    data: transactions.map((t: any) => ({
      id: t.id,
      packageId: t.package_id,
      packageName: t.package_name,
      amount: parseFloat(t.amount),
      flexPoints: t.flex_points,
      bonusPercentage: t.bonus_percentage,
      status: t.status,
      paymentMethod: t.payment_method,
      paymentId: t.payment_id,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    })),
    pagination: {
      page,
      pageSize,
      total: parseInt(count),
      totalPages: Math.ceil(parseInt(count) / pageSize),
    },
  });
}

/**
 * Get a single transaction by ID
 */
export async function getTransaction(c: Context) {
  const { userId } = getUser(c);
  const { id } = c.req.param();

  const [transaction] = await sql`
    SELECT
      t.id,
      t.user_id,
      t.package_id,
      t.amount,
      t.flex_points,
      t.status,
      t.payment_method,
      t.payment_id,
      t.created_at,
      t.updated_at,
      p.name as package_name,
      p.bonus_percentage
    FROM transactions t
    JOIN packages p ON t.package_id = p.id
    WHERE t.id = ${id}
  `;

  if (!transaction) {
    throw new AppError(404, 'Transaction not found', 'TRANSACTION_NOT_FOUND');
  }

  if (transaction.user_id !== userId) {
    throw new AppError(403, 'Unauthorized', 'UNAUTHORIZED');
  }

  return c.json({
    data: {
      id: transaction.id,
      packageId: transaction.package_id,
      packageName: transaction.package_name,
      amount: parseFloat(transaction.amount),
      flexPoints: transaction.flex_points,
      bonusPercentage: transaction.bonus_percentage,
      status: transaction.status,
      paymentMethod: transaction.payment_method,
      paymentId: transaction.payment_id,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at,
    },
  });
}

/**
 * Get user's transaction statistics
 */
export async function getTransactionStats(c: Context) {
  const { userId } = getUser(c);

  const [stats] = await sql`
    SELECT
      COUNT(*) as total_transactions,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
      COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_spent,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN flex_points ELSE 0 END), 0) as total_flex_points
    FROM transactions
    WHERE user_id = ${userId}
  `;

  return c.json({
    data: {
      totalTransactions: parseInt(stats.total_transactions),
      completedTransactions: parseInt(stats.completed_transactions),
      pendingTransactions: parseInt(stats.pending_transactions),
      failedTransactions: parseInt(stats.failed_transactions),
      totalSpent: parseFloat(stats.total_spent),
      totalFlexPoints: parseInt(stats.total_flex_points),
    },
  });
}
