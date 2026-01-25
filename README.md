# Real-Time Chat Application

A full-stack real-time chat application with React Native mobile frontend and Node.js/Socket.io backend.

## 🚀 Features

### Real-Time Functionality
- ✅ Instant private messaging
- ✅ Online/offline status indicators
- ✅ Typing indicators
- ✅ Read receipts (✓ sent, ✓✓ read)
- ✅ Unread message counts
- ✅ Message delivery confirmation
- ✅ Optimistic UI updates
- ✅ Auto-reconnection handling

### User Management
- ✅ User registration & authentication
- ✅ Profile avatars
- ✅ Contact list
- ✅ User search

## 📁 Project Structure

```
InterviewTask/
├── LiveBoard-Backend/          # Node.js + Express + Socket.io backend
│   ├── src/
│   │   ├── index.ts           # Main server file with Socket.io
│   │   ├── types/             # TypeScript type definitions
│   │   ├── models/            # MongoDB models
│   │   ├── routes/            # API routes
│   │   └── config/            # Database & configuration
│   ├── SOCKET_EVENTS.md       # Backend socket events documentation
│   └── package.json
│
├── socket_app_example_01/     # React Native mobile app
│   ├── src/
│   │   ├── pages/             # Screen components
│   │   │   ├── Auth/          # Login & Signup
│   │   │   └── Main/          # Home & Chat screens
│   │   ├── utils/             # Utilities (socket, storage)
│   │   ├── config/            # API & socket configuration
│   │   └── App.tsx            # Main app component
│   ├── REALTIME_FEATURES.md   # Frontend documentation
│   └── package.json
│
├── IMPLEMENTATION_SUMMARY.md  # Complete feature summary
├── TESTING_GUIDE.md          # Testing instructions
└── README.md                 # This file
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time**: Socket.io
- **Database**: MongoDB
- **Language**: TypeScript
- **Authentication**: JWT

### Frontend
- **Framework**: React Native
- **Navigation**: React Navigation
- **Real-time**: Socket.io-client
- **State**: React Hooks
- **Storage**: AsyncStorage
- **HTTP**: Axios

## 🏃 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- MongoDB (running instance)
- React Native environment setup
- iOS Simulator or Android Emulator (or physical device)

### Backend Setup

```bash
cd LiveBoard-Backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and settings

# Build TypeScript
npm run build

# Start server
npm run dev
```

Backend will run on `http://localhost:4000` (or your configured port)

### Frontend Setup

```bash
cd socket_app_example_01

# Install dependencies
npm install

# For iOS
cd ios && pod install && cd ..
npx react-native run-ios

# For Android
npx react-native run-android
```

### Socket Configuration

Update socket URL in `socket_app_example_01/src/utils/socket.js`:

```javascript
const SOCKET_URL = 'http://YOUR_IP:4000';  // Use local IP for physical devices
```

## 📱 Usage

1. **Register/Login**: Create account or login with existing credentials
2. **View Contacts**: See all users with online status (green dot)
3. **Start Chat**: Tap on a contact to start chatting
4. **Send Messages**: Type and send real-time messages
5. **Typing Indicator**: See when the other person is typing
6. **Read Receipts**: Know when messages are delivered (✓) and read (✓✓)
7. **Unread Counts**: Badge shows number of unread messages per conversation

## 🧪 Testing

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed testing scenarios.

**Quick Test**:
1. Login on two devices with different accounts
2. Send message from Device A
3. Verify real-time delivery on Device B
4. Check online status, typing indicators, and read receipts

## 📚 Documentation

- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Complete feature overview
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testing instructions
- [LiveBoard-Backend/SOCKET_EVENTS.md](./LiveBoard-Backend/SOCKET_EVENTS.md) - Backend events
- [socket_app_example_01/REALTIME_FEATURES.md](./socket_app_example_01/REALTIME_FEATURES.md) - Frontend features

## 🔧 Development

### Backend Development
```bash
cd LiveBoard-Backend
npm run dev    # Start with nodemon (auto-reload)
```

### Frontend Development
```bash
cd socket_app_example_01
npm start      # Start Metro bundler
```

## 🏗️ Architecture

### Socket Events Flow

```
Client A → Backend → Client B
   ↓
register_user → user_list broadcast
send_private_message → receive_private_message
typing_private → typing_indicator_private
mark_messages_read → messages_read_update
```

### Database Schema

**User**
- name, email, avatar
- isOnline, socketId
- timestamps

**Message**
- text, sender, recipient
- isPrivate, isRead
- timestamps

## 🚀 Deployment

### Backend Deployment
- Build: `npm run build`
- Start: `npm start` (production)
- Ensure MongoDB is accessible
- Configure CORS for your frontend domain

### Frontend Deployment
- Build for iOS: `cd ios && xcodebuild`
- Build for Android: `cd android && ./gradlew assembleRelease`
- Update socket URL to production backend

## 🐛 Troubleshooting

**Socket not connecting?**
- Check backend is running
- Verify socket URL in frontend
- Ensure devices on same network (for local development)

**Messages not appearing?**
- Check console logs for errors
- Verify user is registered (check backend logs)
- Ensure MongoDB is running

**Online status not updating?**
- Check `register_user` event is emitted
- Verify `user_list` event is received
- Check backend user.isOnline field

## 📄 License

MIT

## 👨‍💻 Developer

Created by Pravesh Kumar
Last Updated: 2026-01-25

---

For questions or issues, please check the documentation files or create an issue.
