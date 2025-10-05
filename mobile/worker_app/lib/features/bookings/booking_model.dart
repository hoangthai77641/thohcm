class Booking {
  final String id;
  final String status;
  final String? note;
  final Map<String, dynamic>? service;
  final Map<String, dynamic>? customer;
  final DateTime date;
  final num? finalPrice;
  final int additionalHours;

  Booking({
    required this.id,
    required this.status,
    required this.date,
    this.note,
    this.service,
    this.customer,
    this.finalPrice,
    this.additionalHours = 0,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['_id'] as String,
      status: json['status'] as String? ?? 'pending',
      note: json['note'] as String?,
      service: json['service'] is Map
          ? Map<String, dynamic>.from(json['service'])
          : null,
      customer: json['customer'] is Map
          ? Map<String, dynamic>.from(json['customer'])
          : null,
      date: DateTime.parse(json['date'] as String),
      finalPrice: json['finalPrice'] as num?,
      additionalHours: json['additionalHours'] as int? ?? 0,
    );
  }

  Booking copyWith({
    String? id,
    String? status,
    String? note,
    Map<String, dynamic>? service,
    Map<String, dynamic>? customer,
    DateTime? date,
    num? finalPrice,
    int? additionalHours,
  }) {
    return Booking(
      id: id ?? this.id,
      status: status ?? this.status,
      note: note ?? this.note,
      service: service ?? this.service,
      customer: customer ?? this.customer,
      date: date ?? this.date,
      finalPrice: finalPrice ?? this.finalPrice,
      additionalHours: additionalHours ?? this.additionalHours,
    );
  }
}
