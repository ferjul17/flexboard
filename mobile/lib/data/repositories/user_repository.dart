import 'package:dio/dio.dart';
import '../models/user_model.dart';
import '../services/api_client.dart';

class UserRepository {
  final ApiClient _apiClient;

  UserRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  /// Get current user profile
  Future<UserModel> getProfile() async {
    try {
      final response = await _apiClient.get('/user/profile');
      return UserModel.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Update user profile
  Future<UserModel> updateProfile({String? username}) async {
    try {
      final response = await _apiClient.put(
        '/user/profile',
        data: {
          if (username != null) 'username': username,
        },
      );
      return UserModel.fromJson(response.data['data']);
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
