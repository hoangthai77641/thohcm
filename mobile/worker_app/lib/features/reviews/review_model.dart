class Review {
  final String id;
  final String serviceId;
  final String customerId;
  final String customerName;
  final int rating;
  final String? comment;
  final DateTime createdAt;

  Review({
    required this.id,
    required this.serviceId,
    required this.customerId,
    required this.customerName,
    required this.rating,
    this.comment,
    required this.createdAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['_id'] ?? '',
      serviceId: json['service'] ?? '',
      customerId: json['customer']['_id'] ?? '',
      customerName: json['customer']['name'] ?? 'Khách hàng',
      rating: json['rating'] ?? 0,
      comment: json['comment'],
      createdAt: DateTime.parse(
        json['createdAt'] ?? DateTime.now().toIso8601String(),
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {'rating': rating, 'comment': comment};
  }
}
