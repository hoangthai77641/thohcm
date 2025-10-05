import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:video_player/video_player.dart';
import 'dart:io';

class MediaPickerWidget extends StatefulWidget {
  final List<String> initialImages;
  final List<String> initialVideos;
  final Function(List<String>, List<String>) onMediaChanged;

  const MediaPickerWidget({
    super.key,
    required this.initialImages,
    required this.initialVideos,
    required this.onMediaChanged,
  });

  @override
  MediaPickerWidgetState createState() => MediaPickerWidgetState();
}

class MediaPickerWidgetState extends State<MediaPickerWidget> {
  final ImagePicker _picker = ImagePicker();
  List<String> _images = [];
  List<String> _videos = [];
  List<File> _newImageFiles = [];
  List<File> _newVideoFiles = [];
  List<String> _newImageUrls = [];
  List<String> _newVideoUrls = [];
  Map<String, VideoPlayerController> _videoControllers = {};

  @override
  void initState() {
    super.initState();
    _images = List.from(widget.initialImages);
    _videos = List.from(widget.initialVideos);
  }

  @override
  void dispose() {
    // Dispose video controllers
    for (var controller in _videoControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 80,
      );

      if (image != null) {
        final file = File(image.path);
        print('📸 Selected image path: ${image.path}');
        print('📁 File exists: ${await file.exists()}');
        if (await file.exists()) {
          print('📊 File size: ${await file.length()} bytes');
        }

        setState(() {
          _newImageFiles.add(file);
        });
        _notifyChange();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Lỗi chọn ảnh: $e')));
      }
    }
  }

  Future<void> _takePhoto() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );

      if (image != null) {
        final file = File(image.path);
        setState(() {
          _newImageFiles.add(file);
        });
        _notifyChange();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Lỗi chụp ảnh: $e')));
      }
    }
  }

  Future<void> _pickVideo() async {
    try {
      final XFile? video = await _picker.pickVideo(
        source: ImageSource.gallery,
        maxDuration: const Duration(minutes: 2), // Limit to 2 minutes
      );

      if (video != null) {
        final file = File(video.path);
        setState(() {
          _newVideoFiles.add(file);
        });
        _notifyChange();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Lỗi chọn video: $e')));
      }
    }
  }

  Future<void> _recordVideo() async {
    try {
      final XFile? video = await _picker.pickVideo(
        source: ImageSource.camera,
        maxDuration: const Duration(minutes: 2),
      );

      if (video != null) {
        final file = File(video.path);
        setState(() {
          _newVideoFiles.add(file);
        });
        _notifyChange();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Lỗi quay video: $e')));
      }
    }
  }

  void _removeImage(int index, {bool isExisting = true, bool isUrl = false}) {
    setState(() {
      if (isExisting && !isUrl) {
        _images.removeAt(index);
      } else if (isUrl) {
        _newImageUrls.removeAt(index);
      } else {
        _newImageFiles.removeAt(index);
      }
    });
    _notifyChange();
  }

  void _removeVideo(int index, {bool isExisting = true, bool isUrl = false}) {
    setState(() {
      if (isExisting && !isUrl) {
        final videoUrl = _videos[index];
        _videoControllers[videoUrl]?.dispose();
        _videoControllers.remove(videoUrl);
        _videos.removeAt(index);
      } else if (isUrl) {
        _newVideoUrls.removeAt(index);
      } else {
        _newVideoFiles.removeAt(index);
      }
    });
    _notifyChange();
  }

  Future<void> _addImageUrl() async {
    final urlController = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Thêm ảnh từ URL'),
        content: TextField(
          controller: urlController,
          decoration: const InputDecoration(
            labelText: 'URL ảnh',
            hintText: 'https://example.com/image.jpg',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, urlController.text.trim()),
            child: const Text('Thêm'),
          ),
        ],
      ),
    );

    if (result != null && result.isNotEmpty) {
      if (_isValidImageUrl(result)) {
        setState(() {
          _newImageUrls.add(result);
        });
        _notifyChange();
      } else {
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('URL ảnh không hợp lệ')));
        }
      }
    }
  }

  Future<void> _addVideoUrl() async {
    final urlController = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Thêm video từ URL'),
        content: TextField(
          controller: urlController,
          decoration: const InputDecoration(
            labelText: 'URL video',
            hintText: 'https://example.com/video.mp4',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, urlController.text.trim()),
            child: const Text('Thêm'),
          ),
        ],
      ),
    );

    if (result != null && result.isNotEmpty) {
      if (_isValidVideoUrl(result)) {
        setState(() {
          _newVideoUrls.add(result);
        });
        _notifyChange();
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('URL video không hợp lệ')),
          );
        }
      }
    }
  }

  bool _isValidImageUrl(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null || !uri.hasScheme) return false;

    // Check for popular image hosting platforms
    final host = uri.host.toLowerCase();
    if (host.contains('imgur.com') ||
        host.contains('cloudinary.com') ||
        host.contains('amazonaws.com') ||
        host.contains('googleusercontent.com') ||
        host.contains('facebook.com') ||
        host.contains('instagram.com') ||
        host.contains('pinterest.com')) {
      return true;
    }

    // Check for direct image file URLs
    final validExtensions = [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
      'bmp',
      'svg',
      'tiff',
      'ico',
    ];
    final path = uri.path.toLowerCase();
    return validExtensions.any((ext) => path.endsWith('.$ext'));
  }

  bool _isValidVideoUrl(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null || !uri.hasScheme) return false;

    // Check for popular video platforms
    final host = uri.host.toLowerCase();
    if (host.contains('youtube.com') ||
        host.contains('youtu.be') ||
        host.contains('vimeo.com') ||
        host.contains('dailymotion.com') ||
        host.contains('facebook.com') ||
        host.contains('instagram.com') ||
        host.contains('tiktok.com')) {
      return true;
    }

    // Check for direct video file URLs
    final validExtensions = [
      'mp4',
      'avi',
      'mov',
      'mkv',
      'webm',
      'm4v',
      'flv',
      '3gp',
    ];
    final path = uri.path.toLowerCase();
    return validExtensions.any((ext) => path.endsWith('.$ext'));
  }

  void _notifyChange() {
    // Combine existing and new URLs
    final allImages = [..._images, ..._newImageUrls];
    final allVideos = [..._videos, ..._newVideoUrls];

    print('🔄 _notifyChange called:');
    print('  _images: ${_images.length}');
    print('  _newImageUrls: ${_newImageUrls.length}');
    print('  _videos: ${_videos.length}');
    print('  _newVideoUrls: ${_newVideoUrls.length}');
    print('  allImages: ${allImages.length}');
    print('  allVideos: ${allVideos.length}');

    widget.onMediaChanged(allImages, allVideos);
  }

  Widget _buildImageItem(
    String imageUrl,
    int index, {
    bool isExisting = true,
    bool isUrl = false,
  }) {
    return Stack(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: (isExisting && !isUrl) || isUrl
              ? Image.network(
                  imageUrl,
                  width: 100,
                  height: 100,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      width: 100,
                      height: 100,
                      color: Colors.grey[300],
                      child: const Icon(Icons.error),
                    );
                  },
                )
              : Image.file(
                  File(imageUrl),
                  width: 100,
                  height: 100,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    print('Error loading image: $imageUrl, Error: $error');
                    return Container(
                      width: 100,
                      height: 100,
                      color: Colors.grey[300],
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error, color: Colors.red),
                          const SizedBox(height: 4),
                          Text(
                            'Lỗi ảnh',
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
        Positioned(
          top: 4,
          right: 4,
          child: GestureDetector(
            onTap: () =>
                _removeImage(index, isExisting: isExisting, isUrl: isUrl),
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, color: Colors.white, size: 20),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildVideoItem(
    String videoPath,
    int index, {
    bool isExisting = true,
    bool isUrl = false,
  }) {
    return Stack(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Container(
            width: 100,
            height: 100,
            color: Colors.black,
            child: const Icon(
              Icons.play_circle_outline,
              color: Colors.white,
              size: 40,
            ),
          ),
        ),
        Positioned(
          top: 4,
          right: 4,
          child: GestureDetector(
            onTap: () =>
                _removeVideo(index, isExisting: isExisting, isUrl: isUrl),
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, color: Colors.white, size: 20),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Media selection buttons
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _showImageOptions,
                icon: const Icon(Icons.photo),
                label: const Text('Thêm ảnh'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _showVideoOptions,
                icon: const Icon(Icons.videocam),
                label: const Text('Thêm video'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Debug info (can be removed in production)
        if (_newImageFiles.isNotEmpty || _newVideoFiles.isNotEmpty) ...[
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.blue[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.blue[200]!),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Debug Info:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                if (_newImageFiles.isNotEmpty) ...[
                  Text('New Images: ${_newImageFiles.length}'),
                  for (int i = 0; i < _newImageFiles.length; i++)
                    Text(
                      '  ${i + 1}. ${_newImageFiles[i].path}',
                      style: const TextStyle(fontSize: 12),
                    ),
                ],
                if (_newVideoFiles.isNotEmpty) ...[
                  Text('New Videos: ${_newVideoFiles.length}'),
                  for (int i = 0; i < _newVideoFiles.length; i++)
                    Text(
                      '  ${i + 1}. ${_newVideoFiles[i].path}',
                      style: const TextStyle(fontSize: 12),
                    ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Display existing and new images
        if (_images.isNotEmpty ||
            _newImageFiles.isNotEmpty ||
            _newImageUrls.isNotEmpty) ...[
          const Text('Ảnh:', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              // Existing images
              ..._images.asMap().entries.map(
                (entry) =>
                    _buildImageItem(entry.value, entry.key, isExisting: true),
              ),
              // New image files
              ..._newImageFiles.asMap().entries.map(
                (entry) => _buildImageItem(
                  entry.value.path,
                  entry.key,
                  isExisting: false,
                ),
              ),
              // New image URLs
              ..._newImageUrls.asMap().entries.map(
                (entry) => _buildImageItem(
                  entry.value,
                  entry.key,
                  isExisting: false,
                  isUrl: true,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],

        // Display existing and new videos
        if (_videos.isNotEmpty ||
            _newVideoFiles.isNotEmpty ||
            _newVideoUrls.isNotEmpty) ...[
          const Text('Video:', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              // Existing videos
              ..._videos.asMap().entries.map(
                (entry) =>
                    _buildVideoItem(entry.value, entry.key, isExisting: true),
              ),
              // New video files
              ..._newVideoFiles.asMap().entries.map(
                (entry) => _buildVideoItem(
                  entry.value.path,
                  entry.key,
                  isExisting: false,
                ),
              ),
              // New video URLs
              ..._newVideoUrls.asMap().entries.map(
                (entry) => _buildVideoItem(
                  entry.value,
                  entry.key,
                  isExisting: false,
                  isUrl: true,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  void _showImageOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Chọn từ thư viện'),
              subtitle: const Text('Có thể không hoạt động trên emulator'),
              onTap: () {
                Navigator.pop(context);
                _pickImage();
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Chụp ảnh'),
              subtitle: const Text('Hoạt động tốt trên emulator'),
              onTap: () {
                Navigator.pop(context);
                _takePhoto();
              },
            ),
            ListTile(
              leading: const Icon(Icons.link),
              title: const Text('Thêm từ URL'),
              subtitle: const Text('Nhập URL ảnh trực tuyến'),
              onTap: () {
                Navigator.pop(context);
                _addImageUrl();
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showVideoOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.video_library),
              title: const Text('Chọn từ thư viện'),
              onTap: () {
                Navigator.pop(context);
                _pickVideo();
              },
            ),
            ListTile(
              leading: const Icon(Icons.videocam),
              title: const Text('Quay video'),
              onTap: () {
                Navigator.pop(context);
                _recordVideo();
              },
            ),
            ListTile(
              leading: const Icon(Icons.link),
              title: const Text('Thêm từ URL'),
              subtitle: const Text('Nhập URL video trực tuyến'),
              onTap: () {
                Navigator.pop(context);
                _addVideoUrl();
              },
            ),
          ],
        ),
      ),
    );
  }

  // Getters for the files to be uploaded
  List<File> get newImages => _newImageFiles;
  List<File> get newVideos => _newVideoFiles;
  List<String> get newImageUrls => _newImageUrls;
  List<String> get newVideoUrls => _newVideoUrls;
}
