import 'package:dio/dio.dart';
import '../models/package_model.dart';
import '../services/api_client.dart';

class PackageRepository {
  final ApiClient _apiClient;

  PackageRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  /// Get all available packages
  Future<List<PackageModel>> getPackages() async {
    try {
      final response = await _apiClient.get('/packages');
      final List<dynamic> data = response.data['data'];
      return data.map((json) => PackageModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Get a single package by ID
  Future<PackageModel> getPackageById(String id) async {
    try {
      final response = await _apiClient.get('/packages/$id');
      return PackageModel.fromJson(response.data['data']);
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
