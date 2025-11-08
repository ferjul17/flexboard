import 'package:dio/dio.dart';
import '../models/leaderboard_model.dart';
import '../services/api_client.dart';

class LeaderboardRepository {
  final ApiClient _apiClient;

  LeaderboardRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  /// Get global leaderboard
  Future<LeaderboardResponseModel> getGlobalLeaderboard({
    int page = 1,
    int pageSize = 50,
  }) async {
    try {
      final response = await _apiClient.get(
        '/leaderboard/global',
        queryParameters: {
          'page': page,
          'pageSize': pageSize,
        },
      );
      return LeaderboardResponseModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Get monthly leaderboard
  Future<LeaderboardResponseModel> getMonthlyLeaderboard({
    int page = 1,
    int pageSize = 50,
  }) async {
    try {
      final response = await _apiClient.get(
        '/leaderboard/monthly',
        queryParameters: {
          'page': page,
          'pageSize': pageSize,
        },
      );
      return LeaderboardResponseModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Get weekly leaderboard
  Future<LeaderboardResponseModel> getWeeklyLeaderboard({
    int page = 1,
    int pageSize = 50,
  }) async {
    try {
      final response = await _apiClient.get(
        '/leaderboard/weekly',
        queryParameters: {
          'page': page,
          'pageSize': pageSize,
        },
      );
      return LeaderboardResponseModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Get regional leaderboard
  Future<LeaderboardResponseModel> getRegionalLeaderboard({
    required String region,
    int page = 1,
    int pageSize = 50,
  }) async {
    try {
      final response = await _apiClient.get(
        '/leaderboard/regional',
        queryParameters: {
          'region': region,
          'page': page,
          'pageSize': pageSize,
        },
      );
      return LeaderboardResponseModel.fromJson(response.data);
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
