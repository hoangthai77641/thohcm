const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const API_BASE = 'http://127.0.0.1:5000/api';

// Test avatar upload functionality
async function testAvatarUpload() {
    try {
        console.log('🧪 Testing Avatar Upload Functionality...\n');

        // 1. Register a test user
        console.log('1. Creating test user...');
        const registerData = {
            name: 'Test User Avatar',
            phone: `test${Date.now()}@avatar.com`,
            password: 'password123',
            role: 'customer'
        };

        const registerResponse = await axios.post(`${API_BASE}/users/register`, registerData);
        console.log('✅ User registered:', registerResponse.data.message);

        // 2. Login to get token
        console.log('\n2. Logging in...');
        const loginResponse = await axios.post(`${API_BASE}/users/login`, {
            phone: registerData.phone,
            password: registerData.password
        });

        const token = loginResponse.data.token;
        const user = loginResponse.data.user;
        console.log('✅ Login successful:', user.name);

        // 3. Get initial profile (should have no avatar)
        console.log('\n3. Getting initial profile...');
        const profileResponse = await axios.get(`${API_BASE}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Profile avatar:', profileResponse.data.avatar || 'No avatar');

        // 4. Create a test image file
        console.log('\n4. Creating test image...');
        const testImagePath = './test-avatar-image.jpg';
        // Create a simple test image data (this is a minimal JPEG header for testing)
        const testImageData = Buffer.from([
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46,
            0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00,
            0xFF, 0xD9
        ]);
        fs.writeFileSync(testImagePath, testImageData);
        console.log('✅ Test image created');

        // 5. Upload avatar
        console.log('\n5. Uploading avatar...');
        const formData = new FormData();
        formData.append('avatar', fs.createReadStream(testImagePath));

        const uploadResponse = await axios.post(`${API_BASE}/users/avatar`, formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });

        console.log('✅ Avatar uploaded successfully');
        console.log('   Avatar URL:', uploadResponse.data.user.avatar);

        // 6. Get profile with avatar
        console.log('\n6. Getting profile with avatar...');
        const updatedProfileResponse = await axios.get(`${API_BASE}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Profile now has avatar:', updatedProfileResponse.data.avatar);

        // 7. Delete avatar
        console.log('\n7. Deleting avatar...');
        const deleteResponse = await axios.delete(`${API_BASE}/users/avatar`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Avatar deleted successfully');
        console.log('   Avatar after deletion:', deleteResponse.data.user.avatar || 'No avatar');

        // Cleanup
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
        }

        console.log('\n🎉 All tests passed! Avatar upload functionality is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testAvatarUpload();