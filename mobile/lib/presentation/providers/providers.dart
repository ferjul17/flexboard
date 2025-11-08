import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../data/services/api_client.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/user_repository.dart';
import '../../data/repositories/package_repository.dart';
import '../../data/repositories/leaderboard_repository.dart';
import '../../data/repositories/transaction_repository.dart';
import '../../data/repositories/payment_repository.dart';

// Core providers
final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(storage: ref.watch(secureStorageProvider));
});

// Repository providers
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(apiClient: ref.watch(apiClientProvider));
});

final userRepositoryProvider = Provider<UserRepository>((ref) {
  return UserRepository(apiClient: ref.watch(apiClientProvider));
});

final packageRepositoryProvider = Provider<PackageRepository>((ref) {
  return PackageRepository(apiClient: ref.watch(apiClientProvider));
});

final leaderboardRepositoryProvider = Provider<LeaderboardRepository>((ref) {
  return LeaderboardRepository(apiClient: ref.watch(apiClientProvider));
});

final transactionRepositoryProvider = Provider<TransactionRepository>((ref) {
  return TransactionRepository(apiClient: ref.watch(apiClientProvider));
});

final paymentRepositoryProvider = Provider<PaymentRepository>((ref) {
  return PaymentRepository(apiClient: ref.watch(apiClientProvider));
});
