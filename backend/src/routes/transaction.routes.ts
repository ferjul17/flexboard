import { Hono } from 'hono';
import { authenticateUser } from '../middleware/auth';
import {
  getTransactions,
  getTransaction,
  getTransactionStats,
} from '../controllers/transaction.controller';

const transactionRoutes = new Hono();

// All routes are protected
transactionRoutes.use('/*', authenticateUser);

// Get transaction history
transactionRoutes.get('/', getTransactions);

// Get transaction statistics
transactionRoutes.get('/stats', getTransactionStats);

// Get single transaction
transactionRoutes.get('/:id', getTransaction);

export default transactionRoutes;
