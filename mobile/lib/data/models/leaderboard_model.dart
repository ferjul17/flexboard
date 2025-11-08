import 'package:freezed_annotation/freezed_annotation.dart';

part 'leaderboard_model.freezed.dart';
part 'leaderboard_model.g.dart';

@freezed
class LeaderboardEntryModel with _$LeaderboardEntryModel {
  const factory LeaderboardEntryModel({
    required int rank,
    required String userId,
    required String username,
    required int totalFlexPoints,
    required double totalSpent,
  }) = _LeaderboardEntryModel;

  factory LeaderboardEntryModel.fromJson(Map<String, dynamic> json) =>
      _$LeaderboardEntryModelFromJson(json);
}

@freezed
class LeaderboardResponseModel with _$LeaderboardResponseModel {
  const factory LeaderboardResponseModel({
    required List<LeaderboardEntryModel> data,
    required PaginationModel pagination,
  }) = _LeaderboardResponseModel;

  factory LeaderboardResponseModel.fromJson(Map<String, dynamic> json) =>
      _$LeaderboardResponseModelFromJson(json);
}

@freezed
class PaginationModel with _$PaginationModel {
  const factory PaginationModel({
    required int page,
    required int pageSize,
    required int total,
    required int totalPages,
  }) = _PaginationModel;

  factory PaginationModel.fromJson(Map<String, dynamic> json) =>
      _$PaginationModelFromJson(json);
}
