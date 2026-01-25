# Quick Testing Guide

## Setup

1. **Backend**: Already running on `http://192.168.0.102:4000`
2. **Frontend**: Run on physical devices or simulators

## Test Scenarios

### 1. Online Status Test (2 devices needed)

**Device A:**
1. Login with user1@example.com
2. Go to Home screen
3. Observer user list

**Device B:**
1. Login with user2@example.com
2. Go to Home screen
3. ✅ Device A should show green dot next to Device B's user
4. ✅ Device B should show green dot next to Device A's user

**Logout Test:**
1. On Device B, tap logout button (⏻)
2. ✅ Device A should immediately remove green dot from Device B's user

### 2. Real-Time Messaging Test

**Setup:**
- Device A logged in as user1@example.com
- Device B logged in as user2@example.com

**Test Steps:**
1. On Device A: Tap on user2 from contact list
2. Type: "Hello from Device A"
3. Tap Send
4. ✅ Message appears immediately on Device A with ⏱ icon
5. ✅ Message appears on Device B in real-time
6. ✅ Device A shows ✓ (delivered)

### 3. Typing Indicator Test

**Device A:**
1. Open chat with user2
2. Start typing in the message input
3. ✅ Device B should see "typing..." below user1's name in header
4. Stop typing and wait 2 seconds
5. ✅ "typing..." should disappear

### 4. Read Receipts Test

**Continuation from Messaging Test:**
1. On Device B: Open chat with user1
2. ✅ Device A should now show ✓✓ (double checkmark) instead of ✓
3. This indicates the message was read by Device B

### 5. Unread Count Test

**Device A:**
1. Go to Home screen (leave chat)

**Device B:**
1. In chat with user1, send 3 messages:
   - "Message 1"
   - "Message 2"  
   - "Message 3"

**Device A:**
1. Check Home screen
2. ✅ Badge with "3" should appear next to user2
3. Tap on user2 to open chat
4. ✅ Badge should immediately disappear
5. Go back to Home screen
6. ✅ Badge should still be gone (messages marked as read)

### 6. App Backgrounding Test

**Device A:**
1. With app open on Home screen
2. Press Home button (background the app)
3. Wait 5 seconds
4. Return to app
5. ✅ App should reconnect socket (check console logs)
6. ✅ Online status should still work
7. ✅ New messages should still arrive

### 7. Pull-to-Refresh Test

**Device A:**
1. On Home screen
2. Pull down to refresh
3. ✅ Loading indicator appears
4. ✅ User list refreshes
5. ✅ Online statuses update
6. ✅ Unread counts update

## Debugging

### Check Backend Logs

```bash
# In LiveBoard-Backend terminal
```

Look for:
- `User registered: <name> (<id>)`
- `User registered and Online: <name> (<id>)`
- `Private Message from <sender> to <recipient>: <text>`
- `User marked offline: <name>`

### Check Frontend Console

In Metro bundler terminal, look for:
- `Socket connected: <socket-id>`
- `Socket connected/ready. Registering: <name>`
- `Online Users via Socket: <count>`

### Common Issues

**Issue**: Green dot not showing
- **Check**: Are both devices connected to same network?
- **Check**: Is backend running and accessible?
- **Check**: Console logs show "Socket connected"?

**Issue**: Messages not appearing
- **Check**: Socket connected on both devices?
- **Check**: Backend logs show "Private Message from..."?
- **Check**: User IDs correct in navigation params?

**Issue**: Typing indicator not working
- **Check**: Both users in same chat?
- **Check**: Socket events being emitted (check console)?
- **Check**: Timeout clearing properly?

**Issue**: Unread count wrong
- **Check**: Messages marked as read when opening chat?
- **Check**: Backend aggregation returning correct count?
- **Check**: Socket event `unread_count_update` received?

## Expected Console Output

### Device A (Sender):
```
Socket connected: abc123
Socket connected/ready. Registering: User A
Online Users via Socket: 2
[send message] → send_private_message
[receive] → message_delivered
[receive] → messages_read_update
```

### Device B (Recipient):
```
Socket connected: def456
Socket connected/ready. Registering: User B
Online Users via Socket: 2
[receive] → receive_private_message
[receive] → unread_count_update
[send] → mark_messages_read
```

### Backend:
```
User connected: abc123
Registering user: usera@example.com
User registered and Online: User A (507f1f77bcf86cd799439011)
User connected: def456
Registering user: userb@example.com
User registered and Online: User B (507f191e810c19729de860ea)
Private Message from User A to User B: Hello from Device A
```

## Success Criteria

All features working = ✅ Ready for production!

- ✅ Real-time online/offline status
- ✅ Instant message delivery
- ✅ Typing indicators
- ✅ Read receipts (✓ and ✓✓)
- ✅ Unread message counts
- ✅ Survives app backgrounding
- ✅ Pull-to-refresh works
- ✅ Optimistic UI updates
- ✅ Proper cleanup on logout
