import 'package:dio/dio.dart';
import '../models/transaction_model.dart';
import '../services/api_client.dart';

class TransactionRepository {
  final ApiClient _apiClient;

  TransactionRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  /// Get transaction history
  Future<List<TransactionModel>> getTransactions({
    int page = 1,
    int pageSize = 20,
    String? status,
  }) async {
    try {
      final response = await _apiClient.get(
        '/transactions',
        queryParameters: {
          'page': page,
          'pageSize': pageSize,
          if (status != null) 'status': status,
        },
      );
      final List<dynamic> data = response.data['data'];
      return data.map((json) => TransactionModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Get single transaction
  Future<TransactionModel> getTransaction(String id) async {
    try {
      final response = await _apiClient.get('/transactions/$id');
      return TransactionModel.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Get transaction statistics
  Future<TransactionStatsModel> getTransactionStats() async {
    try {
      final response = await _apiClient.get('/transactions/stats');
      return TransactionStatsModel.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  String _handleError(DioException error) {
    if (error.response?.data != null) {
      final message = error.response?.data['error'] ?? error.response?.data['message'];
      return message ?? 'An error occurred';
    }
    return 'Network error. Please check your connection.';
  }
}
