# 🔧 Thợ HCM - Home Repair Service Platform

<div align="center">
  <img src="web/public/icons/icon-192x192.png" alt="Thợ HCM Logo" width="120" height="120">
  
  **Professional Home Repair Services in Ho Chi Minh City**
  
  [![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
  [![Flutter](https://img.shields.io/badge/Flutter-02569B?style=flat&logo=flutter&logoColor=white)](https://flutter.dev/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)](https://mongodb.com/)
  [![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=flat&logo=socket.io&logoColor=white)](https://socket.io/)
</div>

## 📖 Overview

Thợ HCM is a comprehensive digital platform that connects customers with skilled technicians for electrical and refrigeration repair services in Ho Chi Minh City. Built with modern technologies, it provides seamless booking, real-time tracking, and efficient service management.

### 🎯 Key Features

- **🏠 Customer Web Portal**: Easy service booking and management
- **📱 Worker Mobile App**: Flutter app for technicians with real-time updates
- **⚡ Real-time Communication**: Live booking updates using Socket.IO
- **💳 Payment Integration**: Secure payment processing
- **🌟 VIP Membership**: Premium services and priority booking
- **📊 Analytics Dashboard**: Comprehensive business insights
- **🗺️ Location Services**: GPS-based worker matching
- **⭐ Review System**: Customer feedback and ratings

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Web Client    │    │   Mobile App    │    │   Admin Panel   │
│   (ReactJS)     │    │   (Flutter)     │    │   (ReactJS)     │
│                 │    │                 │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │                         │
                    │     Backend API         │
                    │   (Node.js/Express)     │
                    │                         │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │                         │
                    │      MongoDB            │
                    │   (Database)            │
                    │                         │
                    └─────────────────────────┘
```

## 🚀 Tech Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Multer** for file uploads

### Frontend (Web)
- **ReactJS** with modern hooks
- **Vite** for build tooling
- **CSS3** with responsive design
- **Socket.IO Client** for real-time updates

### Mobile App
- **Flutter** for cross-platform development
- **Dart** programming language
- **HTTP** for API communication
- **Provider** for state management

### Database & Storage
- **MongoDB** for data persistence
- **File System** for image/document storage
- **Indexes** for optimized queries

## 📂 Project Structure

```
dienlanhquy/
├── backend/                 # Node.js API Server
│   ├── controllers/         # Route controllers
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── services/           # Business logic
│   ├── utils/              # Utility functions
│   └── uploads/            # File storage
├── web/                    # React web application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   └── utils/          # Client utilities
│   └── public/             # Static assets
├── mobile/
│   └── worker_app/         # Flutter mobile app
│       ├── lib/            # Dart source code
│       ├── android/        # Android configuration
│       ├── ios/            # iOS configuration
│       └── assets/         # App assets
└── docs/                   # Documentation
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Flutter SDK (v3.0 or higher)
- Git

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/thohcm.git
cd thohcm/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start MongoDB (if local)
mongod

# Seed the database (optional)
npm run seed

# Start development server
npm run dev
```

### Web Client Setup

```bash
cd ../web

# Install dependencies
npm install

# Start development server
npm run dev
```

### Mobile App Setup

```bash
cd ../mobile/worker_app

# Get Flutter dependencies
flutter pub get

# Run on Android emulator
flutter run

# Or run on specific device
flutter run -d <device_id>
```

## 🔐 Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/thohcm

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=5242880

# Socket.IO (optional)
SOCKET_CORS_ORIGIN=http://localhost:3000
```

## 📱 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Booking Endpoints
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Service Endpoints
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service details
- `POST /api/services` - Create service (admin)

### User Management
- `GET /api/users` - Get all users (admin)
- `PUT /api/users/:id` - Update user profile
- `POST /api/users/upload-avatar` - Upload avatar

## 🔄 Real-time Features

The application uses Socket.IO for real-time communication:

- **Booking Updates**: Live status changes
- **Worker Location**: Real-time tracking
- **Notifications**: Instant messaging
- **Admin Dashboard**: Live metrics

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Web client tests
cd ../web
npm test

# Mobile app tests
cd ../mobile/worker_app
flutter test
```

## 🚀 Deployment

### Backend Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Web Deployment
```bash
# Build for production
npm run build

# Deploy dist/ folder to your hosting service
```

### Mobile App Deployment
```bash
# Build APK for Android
flutter build apk --release

# Build iOS app
flutter build ios --release
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer**: Hoang Thai
- **Project Type**: Full-stack Development
- **Duration**: 2024 - Present

## 📞 Contact

- **Email**: your.email@example.com
- **GitHub**: [@yourusername](https://github.com/yourusername)
- **LinkedIn**: [Your LinkedIn](https://linkedin.com/in/yourprofile)

## 🙏 Acknowledgments

- Thanks to all the open-source libraries that made this project possible
- Special thanks to the Flutter and React communities
- Inspired by modern service platforms like Grab and Lalamove

---

<div align="center">
  <p>Made with ❤️ in Ho Chi Minh City</p>
  <p>© 2024 Thợ HCM. All rights reserved.</p>
</div>