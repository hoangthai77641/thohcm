import 'package:flutter/material.dart';
import 'services_repository.dart';
import 'service_edit_screen.dart';
import '../../core/constants.dart';

class ServicesScreen extends StatefulWidget {
  const ServicesScreen({super.key});

  @override
  State<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends State<ServicesScreen> {
  final ServicesRepository _repo = ServicesRepository();
  List<Map<String, dynamic>> _services = [];
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadServices();
  }

  Future<void> _loadServices() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final services = await _repo.list(mine: true);
      setState(() {
        _services = services;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      return double.tryParse(value);
    }
    return null;
  }

  Future<void> _deleteService(String id) async {
    try {
      await _repo.remove(id);
      await _loadServices();
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Đã xóa dịch vụ')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Lỗi: $e')));
      }
    }
  }

  void _showEditDialog([Map<String, dynamic>? service]) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ServiceEditScreen(service: service),
      ),
    );

    if (result == true) {
      _loadServices();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dịch vụ'),
        actions: [
          IconButton(onPressed: _loadServices, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Lỗi: $_error'),
                  ElevatedButton(
                    onPressed: _loadServices,
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            )
          : ListView.builder(
              itemCount: _services.length,
              padding: const EdgeInsets.all(16),
              itemBuilder: (context, index) {
                final service = _services[index];
                final averageRating =
                    _parseDouble(service['averageRating']) ?? 0.0;
                final reviewCount = service['reviewCount'] ?? 0;

                // Debug: Print service data structure
                print('Service data: ${service.toString()}');

                // Handle image URL correctly - check if it's already a full URL or just filename
                String? imageUrl;
                if (service['images'] != null &&
                    (service['images'] as List).isNotEmpty) {
                  final firstImage = (service['images'] as List)[0] as String;
                  if (firstImage.startsWith('http://') ||
                      firstImage.startsWith('https://')) {
                    // Already a complete URL
                    imageUrl = firstImage;
                  } else {
                    // Just a filename, need to construct full URL
                    imageUrl =
                        '${AppConstants.defaultApiUrl}/uploads/services/$firstImage';
                  }
                }

                // Debug: Print image URL
                if (imageUrl != null) {
                  print('Image URL for ${service['name']}: $imageUrl');
                }

                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Service Image
                      ClipRRect(
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(12),
                        ),
                        child: imageUrl != null
                            ? Image.network(
                                imageUrl,
                                height: 200,
                                width: double.infinity,
                                fit: BoxFit.cover,
                                loadingBuilder:
                                    (context, child, loadingProgress) {
                                      if (loadingProgress == null) return child;
                                      return Container(
                                        height: 200,
                                        color: Colors.grey[200],
                                        child: Center(
                                          child: CircularProgressIndicator(
                                            value:
                                                loadingProgress
                                                        .expectedTotalBytes !=
                                                    null
                                                ? loadingProgress
                                                          .cumulativeBytesLoaded /
                                                      loadingProgress
                                                          .expectedTotalBytes!
                                                : null,
                                          ),
                                        ),
                                      );
                                    },
                                errorBuilder: (context, error, stackTrace) {
                                  print(
                                    'Error loading image: $imageUrl - $error',
                                  ); // Debug
                                  return Container(
                                    height: 200,
                                    color: Colors.grey[300],
                                    child: Column(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        const Icon(
                                          Icons.image_not_supported,
                                          size: 50,
                                          color: Colors.grey,
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          'Không thể tải ảnh',
                                          style: TextStyle(
                                            color: Colors.grey[600],
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              )
                            : Container(
                                height: 200,
                                decoration: BoxDecoration(
                                  color: Colors.grey[300],
                                  borderRadius: const BorderRadius.vertical(
                                    top: Radius.circular(12),
                                  ),
                                ),
                                child: const Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.image,
                                        size: 50,
                                        color: Colors.grey,
                                      ),
                                      SizedBox(height: 8),
                                      Text(
                                        'Chưa có ảnh',
                                        style: TextStyle(
                                          color: Colors.grey,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                      ),

                      // Service Info
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Service Name
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    service['name'] ?? '',
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                PopupMenuButton(
                                  itemBuilder: (context) => [
                                    const PopupMenuItem(
                                      value: 'edit',
                                      child: Text('Sửa'),
                                    ),
                                    const PopupMenuItem(
                                      value: 'delete',
                                      child: Text('Xóa'),
                                    ),
                                  ],
                                  onSelected: (value) {
                                    if (value == 'edit') {
                                      _showEditDialog(service);
                                    } else if (value == 'delete') {
                                      showDialog(
                                        context: context,
                                        builder: (context) => AlertDialog(
                                          title: const Text('Xác nhận xóa'),
                                          content: Text(
                                            'Bạn có chắc muốn xóa dịch vụ "${service['name']}"?',
                                          ),
                                          actions: [
                                            TextButton(
                                              onPressed: () =>
                                                  Navigator.pop(context),
                                              child: const Text('Hủy'),
                                            ),
                                            TextButton(
                                              onPressed: () {
                                                Navigator.pop(context);
                                                _deleteService(service['_id']);
                                              },
                                              child: const Text('Xóa'),
                                            ),
                                          ],
                                        ),
                                      );
                                    }
                                  },
                                ),
                              ],
                            ),

                            const SizedBox(height: 8),

                            // Price
                            Text(
                              'Giá: ${service['basePrice']?.toString().replaceAllMapped(RegExp(r"(\d)(?=(\d{3})+(?!\d))"), (m) => '${m[1]}.')} VNĐ',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.green,
                              ),
                            ),

                            const SizedBox(height: 8),

                            // Rating
                            Row(
                              children: [
                                Row(
                                  children: List.generate(5, (starIndex) {
                                    return Icon(
                                      starIndex < averageRating.floor()
                                          ? Icons.star
                                          : starIndex < averageRating
                                          ? Icons.star_half
                                          : Icons.star_border,
                                      color: Colors.amber,
                                      size: 20,
                                    );
                                  }),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  averageRating > 0
                                      ? '${averageRating.toStringAsFixed(1)} ($reviewCount đánh giá)'
                                      : 'Chưa có đánh giá',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showEditDialog(),
        child: const Icon(Icons.add),
      ),
    );
  }
}
