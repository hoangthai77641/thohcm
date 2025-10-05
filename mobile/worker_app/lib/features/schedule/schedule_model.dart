class WorkerSchedule {
  final String id;
  final String workerId;
  final String workerName;
  final List<AvailableSlot> availableSlots;
  final List<int> workingDays;
  final WorkingHours defaultWorkingHours;
  final String currentStatus;
  final CurrentJob? currentJob;
  final DateTime lastUpdated;

  WorkerSchedule({
    required this.id,
    required this.workerId,
    required this.workerName,
    required this.availableSlots,
    required this.workingDays,
    required this.defaultWorkingHours,
    required this.currentStatus,
    this.currentJob,
    required this.lastUpdated,
  });

  factory WorkerSchedule.fromJson(Map<String, dynamic> json) {
    return WorkerSchedule(
      id: json['_id'] ?? '',
      workerId: json['worker']?['_id'] ?? json['worker'] ?? '',
      workerName: json['worker']?['name'] ?? '',
      availableSlots:
          (json['availableSlots'] as List?)
              ?.map((slot) => AvailableSlot.fromJson(slot))
              .toList() ??
          [],
      workingDays: List<int>.from(json['workingDays'] ?? []),
      defaultWorkingHours: WorkingHours.fromJson(
        json['defaultWorkingHours'] ?? {},
      ),
      currentStatus: json['currentStatus'] ?? 'available',
      currentJob: json['currentJob'] != null
          ? CurrentJob.fromJson(json['currentJob'])
          : null,
      lastUpdated: DateTime.parse(
        json['lastUpdated'] ?? DateTime.now().toIso8601String(),
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'worker': workerId,
      'availableSlots': availableSlots.map((slot) => slot.toJson()).toList(),
      'workingDays': workingDays,
      'defaultWorkingHours': defaultWorkingHours.toJson(),
      'currentStatus': currentStatus,
      'currentJob': currentJob?.toJson(),
      'lastUpdated': lastUpdated.toIso8601String(),
    };
  }

  WorkerSchedule copyWith({
    String? id,
    String? workerId,
    String? workerName,
    List<AvailableSlot>? availableSlots,
    List<int>? workingDays,
    WorkingHours? defaultWorkingHours,
    String? currentStatus,
    CurrentJob? currentJob,
    DateTime? lastUpdated,
  }) {
    return WorkerSchedule(
      id: id ?? this.id,
      workerId: workerId ?? this.workerId,
      workerName: workerName ?? this.workerName,
      availableSlots: availableSlots ?? this.availableSlots,
      workingDays: workingDays ?? this.workingDays,
      defaultWorkingHours: defaultWorkingHours ?? this.defaultWorkingHours,
      currentStatus: currentStatus ?? this.currentStatus,
      currentJob: currentJob ?? this.currentJob,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}

class AvailableSlot {
  final String id;
  final DateTime startTime;
  final DateTime endTime;
  final bool isBooked;
  final String? bookingId;
  final String note;

  AvailableSlot({
    required this.id,
    required this.startTime,
    required this.endTime,
    required this.isBooked,
    this.bookingId,
    required this.note,
  });

  factory AvailableSlot.fromJson(Map<String, dynamic> json) {
    return AvailableSlot(
      id: json['_id'] ?? '',
      startTime: DateTime.parse(json['startTime']),
      endTime: DateTime.parse(json['endTime']),
      isBooked: json['isBooked'] ?? false,
      bookingId: json['booking'],
      note: json['note'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'startTime': startTime.toIso8601String(),
      'endTime': endTime.toIso8601String(),
      'isBooked': isBooked,
      'booking': bookingId,
      'note': note,
    };
  }
}

class WorkingHours {
  final String start;
  final String end;

  WorkingHours({required this.start, required this.end});

  factory WorkingHours.fromJson(Map<String, dynamic> json) {
    return WorkingHours(
      start: json['start'] ?? '08:00',
      end: json['end'] ?? '18:00',
    );
  }

  Map<String, dynamic> toJson() {
    return {'start': start, 'end': end};
  }
}

class CurrentJob {
  final String bookingId;
  final DateTime? estimatedCompletionTime;
  final DateTime? actualStartTime;

  CurrentJob({
    required this.bookingId,
    this.estimatedCompletionTime,
    this.actualStartTime,
  });

  factory CurrentJob.fromJson(Map<String, dynamic> json) {
    return CurrentJob(
      bookingId: json['booking']?['_id'] ?? json['booking'] ?? '',
      estimatedCompletionTime: json['estimatedCompletionTime'] != null
          ? DateTime.parse(json['estimatedCompletionTime'])
          : null,
      actualStartTime: json['actualStartTime'] != null
          ? DateTime.parse(json['actualStartTime'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'booking': bookingId,
      'estimatedCompletionTime': estimatedCompletionTime?.toIso8601String(),
      'actualStartTime': actualStartTime?.toIso8601String(),
    };
  }
}

// Response models
class CurrentJobResponse {
  final bool hasCurrentJob;
  final String status;
  final CurrentJob? currentJob;
  final DateTime? estimatedCompletion;
  final int? timeRemaining;
  final String message;

  CurrentJobResponse({
    required this.hasCurrentJob,
    required this.status,
    this.currentJob,
    this.estimatedCompletion,
    this.timeRemaining,
    required this.message,
  });

  factory CurrentJobResponse.fromJson(Map<String, dynamic> json) {
    return CurrentJobResponse(
      hasCurrentJob: json['hasCurrentJob'] ?? false,
      status: json['status'] ?? 'available',
      currentJob: json['currentJob'] != null
          ? CurrentJob.fromJson(json['currentJob'])
          : null,
      estimatedCompletion: json['estimatedCompletion'] != null
          ? DateTime.parse(json['estimatedCompletion'])
          : null,
      timeRemaining: json['timeRemaining'],
      message: json['message'] ?? '',
    );
  }
}

// Model cho khung giờ mặc định
class DefaultTimeSlots {
  final List<String> morning;
  final List<String> afternoon;
  final List<String> evening;
  final List<int> workingDays;
  final WorkingHours defaultWorkingHours;

  DefaultTimeSlots({
    required this.morning,
    required this.afternoon,
    required this.evening,
    required this.workingDays,
    required this.defaultWorkingHours,
  });

  factory DefaultTimeSlots.fromJson(Map<String, dynamic> json) {
    final timeSlots = json['defaultTimeSlots'] ?? {};
    return DefaultTimeSlots(
      morning: List<String>.from(timeSlots['morning'] ?? []),
      afternoon: List<String>.from(timeSlots['afternoon'] ?? []),
      evening: List<String>.from(timeSlots['evening'] ?? []),
      workingDays: List<int>.from(json['workingDays'] ?? []),
      defaultWorkingHours: WorkingHours.fromJson(
        json['defaultWorkingHours'] ?? {},
      ),
    );
  }

  List<String> get allTimeSlots => [...morning, ...afternoon, ...evening];

  Map<String, List<String>> get groupedSlots => {
    'Sáng': morning,
    'Chiều': afternoon,
    'Tối': evening,
  };
}
