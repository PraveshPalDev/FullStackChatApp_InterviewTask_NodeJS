import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { deleteKey, getUser } from '../../../utils/storage';
import axiosClient from '../../../config/axiosClient';
import { API_BASE_URL, GETAllUSERS_API } from '../../../config/url';
import { handleApiError } from '../../../utils/errorHandler';
import styles from './styles';
import { getSocket, connectSocket } from '../../../utils/socket';

export default function Home({ navigation }) {
  const [contacts, setContacts] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(getSocket());
  const loginData = getUser();

  useEffect(() => {
    fetchUserList();
  }, []);

  // Ensure socket is connected on mount (handles persistent state or re-login)
  useEffect(() => {
    if (!getSocket()) {
      connectSocket();
    }
    setSocket(getSocket());
  }, []);

  // Listen for AppState changes to handle socket reconnection
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        connectSocket(); // Ensure connected
        // Wait briefly for reconnection
        setTimeout(() => {
          const newSocket = getSocket();
          setSocket(newSocket);
        }, 500);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  // Register socket events whenever the socket instance changes (e.g. after reconnect)
  useEffect(() => {
    const currentUser = getUser();

    if (socket && currentUser) {
      console.log('Socket initialized, setting up listeners...');

      const handleRegistration = () => {
        console.log('Socket connected/ready. Registering:', currentUser.name);
        socket.emit('register_user', currentUser);
        socket.emit('request_user_list');
        socket.emit('get_unread_counts');
      };

      if (socket.connected) {
        handleRegistration();
      }

      // Listen for connect event (in case it reconnects or wasn't connected yet)
      socket.on('connect', handleRegistration);

      // 3. Listen for online users list updates
      const handleUserList = (onlineUsers) => {
        console.log('Online Users via Socket:', onlineUsers.length);
        const ids = new Set(onlineUsers.map(u => u.id));
        setOnlineUserIds(ids);
      };

      socket.on('user_list', handleUserList);

      // Listen for unread counts
      const handleUnreadCounts = (counts) => {
        const countsMap = {};
        counts.forEach(item => {
          countsMap[item.userId] = item.count;
        });
        setUnreadCounts(countsMap);
      };

      // Listen for individual unread count updates
      const handleUnreadCountUpdate = (data) => {
        setUnreadCounts(prev => ({
          ...prev,
          [data.fromUserId]: data.count
        }));
      };

      socket.on('unread_counts', handleUnreadCounts);
      socket.on('unread_count_update', handleUnreadCountUpdate);

      // Cleanup listeners when socket changes or component unmounts
      return () => {
        socket.off('connect', handleRegistration);
        socket.off('user_list', handleUserList);
        socket.off('unread_counts', handleUnreadCounts);
        socket.off('unread_count_update', handleUnreadCountUpdate);
      };
    }
  }, [socket]);

  const fetchUserList = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(GETAllUSERS_API);
      if (res.status === 200) {
        setContacts(res.data || []);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Merge contacts with online status and sort online users to the top
  const userList = useMemo(() => {
    const usersWithStatus = contacts.map(user => ({
      ...user,
      isOnline: onlineUserIds.has(user.id)
    }));

    // Sort: online users first, then offline users
    return usersWithStatus.sort((a, b) => {
      if (a.isOnline === b.isOnline) return 0;
      return a.isOnline ? -1 : 1;
    });
  }, [contacts, onlineUserIds]);

  const renderItem = useCallback(({ item }) => {
    let avatarUrl = item.avatar;
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      const baseUrl = API_BASE_URL.endsWith('/')
        ? API_BASE_URL.slice(0, -1)
        : API_BASE_URL;
      const path = avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`;
      avatarUrl = `${baseUrl}${path}`;
    }

    const unreadCount = unreadCounts[item.id] || 0;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        activeOpacity={0.7}
        onPress={() => {
          navigation.navigate('Chats', {
            name: item.name,
            avatar: avatarUrl,
            userId: item.id,
          });
        }}
      >
        <View style={styles.avatarContainer}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          {item.isOnline && <View style={styles.onlineBadge} />}
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.rowTop}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>

          <View style={styles.rowBottom}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage || 'Start a conversation'}
            </Text>

            <View style={styles.statusContainer}>
              {unreadCount > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              ) : (
                item.lastMessage &&
                item.isRead && <Text style={styles.readStatus}>✓✓</Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [navigation, unreadCounts]);

  const onRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      fetchUserList();
      if (socket) {
        socket.emit('request_user_list');
        socket.emit('get_unread_counts');
      }
      setLoading(false);
    }, 1000);
  }, [fetchUserList, socket]);

  const logoutHandler = () => {
    if (socket) {
      socket.disconnect();
    }
    deleteKey('loginData');
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <Text style={styles.headerFullName}>{loginData?.name}</Text>
        <TouchableOpacity
          onPress={logoutHandler}
          style={styles.headerAction}
        >

          <Text style={styles.headerActionText}>⏻</Text>
        </TouchableOpacity>
      </View>

      {loading && contacts.length === 0 ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <FlatList
          data={userList}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          initialNumToRender={50}
          refreshing={loading}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}
