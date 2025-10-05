# Avatar Upload Feature - Tính năng Upload Ảnh Đại Diện

## Mô tả / Description
Tính năng cho phép người dùng upload và quản lý ảnh đại diện cá nhân.

## API Endpoints

### 1. Upload Avatar - Tải lên ảnh đại diện
```
POST /api/users/avatar
```

**Headers:**
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: multipart/form-data`

**Body:** 
- `avatar` (file): Image file (JPEG, PNG, WebP)

**Giới hạn:**
- Kích thước tối đa: 2MB
- Định dạng cho phép: JPEG, PNG, WebP
- Chỉ 1 file mỗi lần upload

**Response:**
```json
{
  "message": "Avatar uploaded successfully",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "avatar": "/uploads/avatars/avatar-1234567890-123456789.jpg",
    ...
  }
}
```

### 2. Delete Avatar - Xóa ảnh đại diện
```
DELETE /api/users/avatar
```

**Headers:**
- `Authorization: Bearer <JWT_TOKEN>`

**Response:**
```json
{
  "message": "Avatar deleted successfully",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "avatar": null,
    ...
  }
}
```

### 3. Get Profile - Lấy thông tin cá nhân (bao gồm avatar)
```
GET /api/users/me
```

**Headers:**
- `Authorization: Bearer <JWT_TOKEN>`

**Response:**
```json
{
  "id": "user_id",
  "name": "User Name",
  "avatar": "/uploads/avatars/avatar-1234567890-123456789.jpg",
  ...
}
```

## Cách sử dụng / Usage

### 1. Frontend JavaScript Example
```javascript
// Upload avatar
async function uploadAvatar(file, token) {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const response = await fetch('/api/users/avatar', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return await response.json();
}

// Delete avatar
async function deleteAvatar(token) {
  const response = await fetch('/api/users/avatar', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
}
```

### 2. React Example
```jsx
import React, { useState } from 'react';

function AvatarUpload({ token, onAvatarUpdate }) {
  const [uploading, setUploading] = useState(false);
  
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        onAvatarUpdate(result.user.avatar);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
```

### 3. Flutter/Dart Example
```dart
import 'package:http/http.dart' as http;
import 'dart:io';

Future<Map<String, dynamic>> uploadAvatar(File imageFile, String token) async {
  var request = http.MultipartRequest(
    'POST',
    Uri.parse('http://your-server.com/api/users/avatar'),
  );
  
  request.headers['Authorization'] = 'Bearer $token';
  request.files.add(await http.MultipartFile.fromPath('avatar', imageFile.path));
  
  var response = await request.send();
  var responseData = await response.stream.bytesToString();
  
  return json.decode(responseData);
}
```

## Bảo mật / Security Features

1. **Authentication Required**: Cần JWT token hợp lệ
2. **File Type Validation**: Chỉ chấp nhận JPEG, PNG, WebP
3. **File Size Limit**: Tối đa 2MB
4. **MIME Type Checking**: Kiểm tra MIME type để tránh fake extension
5. **Secure File Storage**: File được lưu với tên random
6. **Auto Cleanup**: Tự động xóa file cũ khi upload file mới

## Lưu ý / Notes

1. Khi upload avatar mới, avatar cũ sẽ được tự động xóa
2. URL avatar có dạng: `/uploads/avatars/filename.ext`
3. Avatar được serve thông qua endpoint static files
4. Nếu không có avatar, field `avatar` sẽ là `null` hoặc `undefined`

## Test

Mở file `test-avatar.html` trong browser để test các chức năng:
1. Nhập JWT token
2. Chọn file ảnh
3. Upload hoặc xóa avatar
4. Xem thông tin profile

## Error Handling

**Lỗi thường gặp:**
- `400`: No avatar file provided, Invalid file type, File too large
- `401`: Invalid or missing JWT token
- `404`: User not found
- `500`: Server error, File system error

**Ví dụ error response:**
```json
{
  "message": "Only JPEG, PNG, and WebP images are allowed for avatars"
}
```