# X∞ Smart Locator

A secure, real-time device tracking platform with GPS monitoring, family tracking, and lost phone mode.

## Features

- **Real-Time GPS Tracking**: Monitor device locations with updates every 5 seconds
- **Live Map View**: Interactive OpenStreetMap integration with real-time markers
- **Lost Phone Mode**: Emergency tracking with 3-second updates
- **Family Tracking**: Create private groups to monitor family devices
- **Location History**: Review past movements and travel paths
- **Smart Notifications**: Alerts for offline devices, low battery, and location changes
- **Secure Authentication**: Email verification and password reset
- **WebSocket Support**: Real-time updates without page refresh
- **PWA Support**: Install as mobile app

## Quick Start

### Prerequisites
- Node.js 14+
- NPM

### Installation

```bash
cd backend
npm install
```

### Configuration

Edit `.env` file:

```env
PORT=3000
JWT_SECRET=your-secret-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
APP_URL=http://localhost:3000
NODE_ENV=development
```

### Run the Application

```bash
npm start
```

Server runs on http://localhost:3000

## Usage

1. **Sign Up**: Create account at `/signup`
2. **Login**: Access dashboard at `/login`
3. **Add Device**: Register a device from dashboard
4. **Share Link**: Send tracking link to device
5. **Track**: Monitor real-time location from dashboard

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/verify-email` - Verify email
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/profile` - Get user profile

### Devices
- `POST /api/devices/register` - Register new device
- `GET /api/devices` - Get all devices
- `GET /api/devices/:deviceId` - Get device details
- `PUT /api/devices/:deviceId` - Update device
- `DELETE /api/devices/:deviceId` - Delete device
- `POST /api/devices/:deviceId/lost-mode` - Toggle lost mode
- `GET /api/devices/:deviceId/history` - Get location history

### Tracking
- `GET /api/track/:deviceId/info` - Get device info
- `POST /api/track/:deviceId/location` - Submit location
- `GET /api/track/:deviceId/latest` - Get latest location

### Family
- `POST /api/family/groups` - Create family group
- `GET /api/family/groups` - Get family groups
- `POST /api/family/groups/:groupId/members` - Add member
- `GET /api/family/groups/:groupId/devices` - Get group devices

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:notificationId/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

## WebSocket

Connect to `ws://localhost:3000/ws`

### Messages
- Authenticate: `{"type": "authenticate", "token": "JWT_TOKEN"}`
- Subscribe: `{"type": "subscribe", "deviceIds": ["device1", "device2"]}`

### Events
- `location_update` - Real-time location update
- `device_status` - Device status change
- `notification` - New notification

## Database

SQLite database with tables:
- `users` - User accounts
- `devices` - Registered devices
- `locations` - Location history
- `family_groups` - Family tracking groups
- `family_members` - Group members
- `notifications` - User notifications

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Real-time**: WebSocket
- **Maps**: OpenStreetMap + Leaflet.js
- **Authentication**: JWT
- **Email**: Nodemailer

## License

MIT License - © 2026 X∞ Smart Locator