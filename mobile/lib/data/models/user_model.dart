import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_model.freezed.dart';
part 'user_model.g.dart';

@freezed
class UserModel with _$UserModel {
  const factory UserModel({
    required String id,
    required String email,
    required String username,
    int? totalFlexPoints,
    double? totalSpent,
    int? rank,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _UserModel;

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);
}

@freezed
class AuthResponse with _$AuthResponse {
  const factory AuthResponse({
    required UserModel user,
    required TokensModel tokens,
  }) = _AuthResponse;

  factory AuthResponse.fromJson(Map<String, dynamic> json) =>
      _$AuthResponseFromJson(json);
}

@freezed
class TokensModel with _$TokensModel {
  const factory TokensModel({
    required String accessToken,
    required String refreshToken,
  }) = _TokensModel;

  factory TokensModel.fromJson(Map<String, dynamic> json) =>
      _$TokensModelFromJson(json);
}
