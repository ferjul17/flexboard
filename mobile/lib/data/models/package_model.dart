import 'package:freezed_annotation/freezed_annotation.dart';

part 'package_model.freezed.dart';
part 'package_model.g.dart';

@freezed
class PackageModel with _$PackageModel {
  const factory PackageModel({
    required String id,
    required String name,
    required double price,
    required int flexPoints,
    required int bonusPercentage,
    String? description,
    required bool isActive,
    DateTime? createdAt,
  }) = _PackageModel;

  factory PackageModel.fromJson(Map<String, dynamic> json) =>
      _$PackageModelFromJson(json);
}
