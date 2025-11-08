import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import {
  getTransactions,
  getTransaction,
  getTransactionStats,
} from '../controllers/transaction.controller';

const transactionRoutes = new Hono();

// All routes are protected
transactionRoutes.use('/*', authMiddleware);

// Get transaction history
transactionRoutes.get('/', getTransactions);

// Get transaction statistics
transactionRoutes.get('/stats', getTransactionStats);

// Get single transaction
transactionRoutes.get('/:id', getTransaction);

export default transactionRoutes;
