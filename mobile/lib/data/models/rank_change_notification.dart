import 'package:equatable/equatable.dart';

/// Model for rank change notifications from WebSocket
class RankChangeNotification extends Equatable {
  final String type;
  final String userId;
  final String leaderboardType;
  final String? region;
  final int? oldRank;
  final int newRank;
  final int rankChange;
  final int totalFlexPoints;
  final DateTime timestamp;

  const RankChangeNotification({
    required this.type,
    required this.userId,
    required this.leaderboardType,
    this.region,
    this.oldRank,
    required this.newRank,
    required this.rankChange,
    required this.totalFlexPoints,
    required this.timestamp,
  });

  factory RankChangeNotification.fromJson(Map<String, dynamic> json) {
    return RankChangeNotification(
      type: json['type'] as String? ?? 'rank_change',
      userId: json['userId'] as String,
      leaderboardType: json['leaderboardType'] as String,
      region: json['region'] as String?,
      oldRank: json['oldRank'] as int?,
      newRank: json['newRank'] as int,
      rankChange: json['rankChange'] as int,
      totalFlexPoints: json['totalFlexPoints'] as int? ?? 0,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'userId': userId,
      'leaderboardType': leaderboardType,
      if (region != null) 'region': region,
      if (oldRank != null) 'oldRank': oldRank,
      'newRank': newRank,
      'rankChange': rankChange,
      'totalFlexPoints': totalFlexPoints,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  /// Whether the rank improved (moved up)
  bool get isImprovement => rankChange > 0;

  /// Whether the rank declined (moved down)
  bool get isDecline => rankChange < 0;

  /// Human-readable rank change description
  String get rankChangeDescription {
    if (rankChange > 0) {
      return '+$rankChange';
    } else if (rankChange < 0) {
      return '$rankChange';
    } else {
      return 'No change';
    }
  }

  @override
  List<Object?> get props => [
        type,
        userId,
        leaderboardType,
        region,
        oldRank,
        newRank,
        rankChange,
        totalFlexPoints,
        timestamp,
      ];
}
