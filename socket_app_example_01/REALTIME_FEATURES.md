# Real-Time Chat Features - Frontend Implementation Guide

## Overview
The React Native frontend now fully supports real-time chat functionality including messaging, typing indicators, read receipts, and unread message counts.

## Architecture

### Socket Management (`utils/socket.js`)
- **Singleton Pattern**: Single socket instance shared across the app
- **Connection Lifecycle**: Auto-connect on app start, reconnect on app foreground
- **State Management**: `getSocket()`, `connectSocket()`, `disconnectSocket()`

### Home Screen (`pages/Main/Home/Home.js`)
Real-time features:
- ✅ Online/offline status indicators (green dot)
- ✅ Unread message counts per conversation
- ✅ Real-time user list updates
- ✅ Pull-to-refresh support

**Key State:**
```javascript
const [contacts, setContacts] = useState([]);        // All users from API
const [onlineUserIds, setOnlineUserIds] = useState(new Set());  // Online users
const [unreadCounts, setUnreadCounts] = useState({});  // { userId: count }
```

**Socket Listeners:**
- `user_list` → Updates online status
- `unread_counts` → Initial unread counts on mount
- `unread_count_update` → Real-time unread count changes

**Socket Emitters:**
- `register_user` → Announce presence
- `request_user_list` → Request online users
- `get_unread_counts` → Request unread counts

### Chat Screen (`pages/Main/chats/Chats.js`)
Real-time features:
- ✅ Instant message delivery
- ✅ Typing indicators ("user is typing...")
- ✅ Read receipts (✓ sent, ✓✓ read)
- ✅ Optimistic UI updates
- ✅ Auto-scroll to new messages

**Key State:**
```javascript
const [messages, setMessages] = useState([]);  // All messages in conversation
const [isTyping, setIsTyping] = useState(false);  // Is other user typing?
const [currentUser, setCurrentUser] = useState(null);  // Logged-in user
```

**Socket Listeners:**
- `receive_private_message` → New message received
- `typing_indicator_private` → Other user typing status
- `messages_read_update` → Your messages were read

**Socket Emitters:**
- `send_private_message` → Send a new message
- `typing_private` → Notify typing status
- `mark_messages_read` → Mark messages as read

## Message Flow

### Sending a Message

1. **User types and sends** → `sendMessage()`
2. **Optimistic Update**: Message immediately appears in UI with "⏱" (pending)
3. **Socket Emit**: `send_private_message` with text, toUserId, user
4. **Server Processing**:
   - Saves to database
   - Emits to recipient (if online)
   - Emits `message_delivered` back to sender
   - Updates unread count for recipient
5. **Recipient Receives**: `receive_private_message` event
6. **Auto-mark as Read**: If chat is open, emit `mark_messages_read`

### Typing Indicator

1. **User types** → `handleTextChange(text)`
2. **Emit**: `typing_private` with `isTyping: true`
3. **Debounce**: After 2 seconds of inactivity, emit `isTyping: false`
4. **Recipient**: Shows "typing..." below name in header

### Read Receipts

1. **User opens chat** → `mark_messages_read` emitted immediately
2. **New message arrives** → Auto-emit `mark_messages_read`
3. **Server**: Updates DB, emits `messages_read_update` to sender
4. **Sender's UI**: Messages show "✓✓" instead of "✓"

### Unread Counts

1. **On Mount/Login**: Emit `get_unread_counts`
2. **Server Response**: `unread_counts` event with array of { userId, count }
3. **Real-time Updates**: `unread_count_update` when new message arrives
4. **Display**: Badge with count on Home screen contact list
5. **Reset**: When user opens chat, count goes to 0

## AppState Handling

**Problem**: Socket disconnects when app backgrounds
**Solution**: Listen to AppState changes

```javascript
useEffect(() => {
  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active') {
      connectSocket();
      setTimeout(() => setSocket(getSocket()), 500);
    }
  };
  const subscription = AppState.addEventListener('change', handleAppStateChange);
  return () => subscription.remove();
}, []);
```

## Key Design Patterns

### 1. Optimistic Updates
Messages appear instantly before server confirmation for better UX.

### 2. Event-Driven State
All real-time features driven by socket events, not polling.

### 3. Separation of Concerns
- **API**: Initial data fetch (contacts, message history)
- **Socket**: Real-time updates (new messages, status changes)
- **useMemo**: Merge API + Socket data for render

### 4. Cleanup
Always remove socket listeners in useEffect cleanup to prevent memory leaks.

## Troubleshooting

### Messages not appearing
- Check: `socket.connected` status
- Check: Console logs for "Socket connected/ready"
- Check: Backend logs for `receive_private_message`

### Online status not updating
- Check: `register_user` emitted on connect
- Check: `user_list` event being received
- Check: Backend user.isOnline field

### Unread counts wrong
- Check: `get_unread_counts` emitted on mount
- Check: `mark_messages_read` emitted when opening chat
- Check: Backend unread count aggregation query

### Typing indicator stuck
- Check: Timeout is clearing properly (2 seconds)
- Check: `isTyping: false` emitted when input clears
- Check: Component unmount cleanup

## Performance Considerations

1. **useCallback**: Memoize functions passed to socket listeners
2. **useMemo**: Merge static + real-time data efficiently
3. **Debouncing**: Typing indicators debounced to reduce events
4. **Batch Updates**: Use functional setState for state updates based on previous state
5. **FlatList**: Virtualized list for performance with many messages

## Future Enhancements

- [ ] Image/File attachments
- [ ] Voice messages
- [ ] Group chats
- [ ] Message reactions
- [ ] Online status "last seen"
- [ ] Push notifications
- [ ] Message search
- [ ] Message deletion/editing
