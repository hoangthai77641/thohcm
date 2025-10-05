import '../../core/api_client.dart';
import 'package:dio/dio.dart';
import 'dart:io';

class ServicesRepository {
  final _client = ApiClient().dio;

  Future<List<Map<String, dynamic>>> list({bool mine = false}) async {
    final queryParams = <String, dynamic>{};
    if (mine) {
      queryParams['mine'] = 'true';
    }

    final res = await _client.get(
      '/api/services',
      queryParameters: queryParams.isEmpty ? null : queryParams,
    );
    return (res.data as List).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> create(
    Map<String, dynamic> payload, {
    List<File>? images,
    List<File>? videos,
  }) async {
    if ((images?.isNotEmpty == true) || (videos?.isNotEmpty == true)) {
      return await _createWithMedia(payload, images: images, videos: videos);
    }

    final res = await _client.post('/api/services', data: payload);
    return Map<String, dynamic>.from(res.data);
  }

  Future<Map<String, dynamic>> update(
    String id,
    Map<String, dynamic> payload, {
    List<File>? images,
    List<File>? videos,
  }) async {
    if ((images?.isNotEmpty == true) || (videos?.isNotEmpty == true)) {
      return await _updateWithMedia(
        id,
        payload,
        images: images,
        videos: videos,
      );
    }

    final res = await _client.put('/api/services/$id', data: payload);
    return Map<String, dynamic>.from(res.data);
  }

  Future<Map<String, dynamic>> _createWithMedia(
    Map<String, dynamic> payload, {
    List<File>? images,
    List<File>? videos,
  }) async {
    final formData = FormData.fromMap(payload);

    // Add image files
    if (images != null) {
      for (int i = 0; i < images.length; i++) {
        final file = images[i];
        formData.files.add(
          MapEntry(
            'images',
            await MultipartFile.fromFile(file.path, filename: 'image_$i.jpg'),
          ),
        );
      }
    }

    // Add video files
    if (videos != null) {
      for (int i = 0; i < videos.length; i++) {
        final file = videos[i];
        formData.files.add(
          MapEntry(
            'videos',
            await MultipartFile.fromFile(file.path, filename: 'video_$i.mp4'),
          ),
        );
      }
    }

    final res = await _client.post('/api/services', data: formData);
    return Map<String, dynamic>.from(res.data);
  }

  Future<Map<String, dynamic>> _updateWithMedia(
    String id,
    Map<String, dynamic> payload, {
    List<File>? images,
    List<File>? videos,
  }) async {
    final formData = FormData.fromMap(payload);

    // Add image files
    if (images != null) {
      for (int i = 0; i < images.length; i++) {
        final file = images[i];
        formData.files.add(
          MapEntry(
            'images',
            await MultipartFile.fromFile(file.path, filename: 'image_$i.jpg'),
          ),
        );
      }
    }

    // Add video files
    if (videos != null) {
      for (int i = 0; i < videos.length; i++) {
        final file = videos[i];
        formData.files.add(
          MapEntry(
            'videos',
            await MultipartFile.fromFile(file.path, filename: 'video_$i.mp4'),
          ),
        );
      }
    }

    final res = await _client.put('/api/services/$id', data: formData);
    return Map<String, dynamic>.from(res.data);
  }

  Future<void> remove(String id) async {
    await _client.delete('/api/services/$id');
  }
}
