import React, { useState, useLayoutEffect, useRef, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './styles';
import theme from '../../../utils/colors';
import { GETMESSAGES_API } from '../../../config/url';
import { handleApiError } from '../../../utils/errorHandler';
import axiosClient from '../../../config/axiosClient';
import { getSocket } from '../../../utils/socket';
import { getUser } from '../../../utils/storage';

export default function Chats({ route, navigation }) {
  const { name, avatar, userId } = route.params;
  const flatListRef = useRef();
  const typingTimeoutRef = useRef(null);

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState(getSocket());
  const [currentUser, setCurrentUser] = useState(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <Image source={{ uri: avatar }} style={styles.headerAvatar} />
          <View>
            <Text style={styles.headerName}>{name}</Text>
            {isTyping && <Text style={styles.typingIndicator}>typing...</Text>}
          </View>
        </View>
      ),
      headerStyle: {
        backgroundColor: theme.colors.background,
      },
      headerShadowVisible: false,
    });
  }, [navigation, name, avatar, isTyping]);

  useEffect(() => {
    const user = getUser();
    setCurrentUser(user);
    fetchMessages();
  }, []);

  // Socket listeners setup
  useEffect(() => {
    if (!socket || !currentUser) return;

    // Listen for incoming messages
    const handleReceiveMessage = (msg) => {
      // Only add message if it's from/to this conversation
      if (msg.fromUserId === userId || msg.toUserId === userId) {
        setMessages(prev => [...prev, {
          id: msg.id,
          text: msg.text,
          user: msg.user,
          createdAt: msg.createdAt,
          isRead: false
        }]);

        // Auto-scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        // Mark as read if we're currently viewing
        if (msg.fromUserId === userId) {
          socket.emit('mark_messages_read', { otherUserId: userId });
        }
      }
    };

    // Listen for typing indicator
    const handleTypingIndicator = (data) => {
      if (data.fromUserId === userId) {
        setIsTyping(data.isTyping);
      }
    };

    // Listen for read receipts
    const handleMessagesRead = (data) => {
      if (data.readByUserId === userId) {
        setMessages(prev => prev.map(msg =>
          msg.user?.id === currentUser.id
            ? { ...msg, isRead: true }
            : msg
        ));
      }
    };

    socket.on('receive_private_message', handleReceiveMessage);
    socket.on('typing_indicator_private', handleTypingIndicator);
    socket.on('messages_read_update', handleMessagesRead);

    // Mark existing messages as read when entering chat
    socket.emit('mark_messages_read', { otherUserId: userId });

    return () => {
      socket.off('receive_private_message', handleReceiveMessage);
      socket.off('typing_indicator_private', handleTypingIndicator);
      socket.off('messages_read_update', handleMessagesRead);
    };
  }, [socket, userId, currentUser]);

  const fetchMessages = async () => {
    try {
      const res = await axiosClient.get(GETMESSAGES_API(userId));
      if (res.status === 200) {
        setMessages(res.data || []);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = useCallback(() => {
    if (message.trim().length === 0 || !socket || !currentUser) return;

    const tempMessage = {
      id: Date.now().toString(),
      text: message.trim(),
      user: currentUser,
      createdAt: new Date().toISOString(),
      isRead: false,
      isPending: true
    };

    // Optimistic update
    setMessages(prev => [...prev, tempMessage]);
    setMessage('');

    // Send via socket
    socket.emit('send_private_message', {
      text: tempMessage.text,
      toUserId: userId,
      user: currentUser
    });

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('typing_private', { toUserId: userId, isTyping: false });
  }, [message, socket, currentUser, userId]);

  const handleTextChange = useCallback((text) => {
    setMessage(text);

    if (!socket) return;

    // Send typing indicator
    socket.emit('typing_private', { toUserId: userId, isTyping: text.length > 0 });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_private', { toUserId: userId, isTyping: false });
    }, 2000);
  }, [socket, userId]);

  const renderItem = ({ item }) => {
    const isMe = item?.user?.id === currentUser?.id;
    const date = new Date(item.createdAt);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View
        style={[
          styles.messageBubble,
          isMe ? styles.myBubble : styles.theirBubble,
        ]}
      >
        <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
          {item.text}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[styles.timestamp, isMe ? styles.myTimestamp : styles.theirTimestamp]}>
            {timeString}
          </Text>
          {isMe && (
            <Text style={styles.readStatus}>
              {item.isPending ? '⏱' : item.isRead ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        initialNumToRender={500}
        maxToRenderPerBatch={10}
        windowSize={10}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={message}
          onChangeText={handleTextChange}
          placeholderTextColor="#999"
          multiline
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton} activeOpacity={0.8}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
