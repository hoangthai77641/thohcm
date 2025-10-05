class Review {
  final String id;
  final String serviceId;
  final String customerId;
  final int rating;
  final String comment;
  final DateTime createdAt;
  final Customer? customer;
  final Service? service;

  Review({
    required this.id,
    required this.serviceId,
    required this.customerId,
    required this.rating,
    required this.comment,
    required this.createdAt,
    this.customer,
    this.service,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['_id'] ?? '',
      serviceId: json['service'] is String
          ? json['service']
          : (json['service']?['_id'] ?? ''),
      customerId: json['customer'] is String
          ? json['customer']
          : (json['customer']?['_id'] ?? ''),
      rating: json['rating'] ?? 0,
      comment: json['comment'] ?? '',
      createdAt: DateTime.parse(
        json['createdAt'] ?? DateTime.now().toIso8601String(),
      ),
      customer: json['customer'] is Map<String, dynamic>
          ? Customer.fromJson(json['customer'])
          : null,
      service: json['service'] is Map<String, dynamic>
          ? Service.fromJson(json['service'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'service': serviceId,
      'customer': customerId,
      'rating': rating,
      'comment': comment,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

class Customer {
  final String id;
  final String name;
  final String? email;

  Customer({required this.id, required this.name, this.email});

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'],
    );
  }
}

class Service {
  final String id;
  final String name;
  final String? description;

  Service({required this.id, required this.name, this.description});

  factory Service.fromJson(Map<String, dynamic> json) {
    return Service(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
    );
  }
}
