import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/transaction_model.dart';
import 'providers.dart';

// Transactions provider
final transactionsProvider = FutureProvider<List<TransactionModel>>((ref) async {
  final transactionRepo = ref.watch(transactionRepositoryProvider);
  return await transactionRepo.getTransactions();
});

// Transaction stats provider
final transactionStatsProvider = FutureProvider<TransactionStatsModel>((ref) async {
  final transactionRepo = ref.watch(transactionRepositoryProvider);
  return await transactionRepo.getTransactionStats();
});

// Single transaction provider
final transactionProvider =
    FutureProvider.family<TransactionModel, String>((ref, id) async {
  final transactionRepo = ref.watch(transactionRepositoryProvider);
  return await transactionRepo.getTransaction(id);
});
