import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, Message as MessageType, User as UserType } from './types';
import connectDB from './config/db';
import User from './models/User';
import Message from './models/Message';
import authRoutes from './routes/auth';
import os from 'os';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/api/auth', authRoutes);

const server = http.createServer(app);

const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>(server, {
    cors: {
        origin: "*", // Allow all for demo purposes
        methods: ["GET", "POST"]
    }
});

connectDB();

// Only used for quick socketId lookups for routing.
// Single source of truth for user state is now MongoDB.
interface ActiveUser {
    socketId: string;
    userId: string;
}
const activeUsers = new Map<string, ActiveUser>(); // socketId -> ActiveUser

const MAX_HISTORY = 150;

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Send history to the new user (Global Chat)
    Message.find({ isPrivate: false })
        .sort({ createdAt: -1 })
        .limit(MAX_HISTORY)
        .populate('sender')
        .then((msgs) => {
            // Transform for client
            const history = msgs.reverse().map(m => ({
                id: m.id,
                text: m.text,
                user: {
                    id: (m.sender as any).id,
                    name: (m.sender as any).name,
                    email: (m.sender as any).email,
                    avatar: (m.sender as any).avatar
                },
                createdAt: m.createdAt.toISOString()
            }));
            socket.emit('history', history);
        });

    socket.on('join_chat', () => {
        // maybe join a specific room if needed in future
        console.log(`User ${socket.id} joined chat`);
    });

    socket.on('register_user', async (userData: UserType) => {
        try {
            console.log('Registering user:', userData.email);
            // Upsert user in DB
            let user = await User.findOne({ email: userData.email });
            if (!user) {
                user = await User.create({
                    name: userData.name,
                    email: userData.email,
                    avatar: userData.avatar,
                    isOnline: true,
                    socketId: socket.id
                });
            } else {
                user.isOnline = true;
                user.socketId = socket.id;
                // Only update avatar if provided
                if (userData.avatar) user.avatar = userData.avatar;
                await user.save();
            }

            // Map socketId -> userId for easy disconnect handling
            activeUsers.set(socket.id, { socketId: socket.id, userId: user.id });

            console.log(`User registered and Online: ${user.name} (${user.id})`);

            // Broadcast updated user list from DB
            const onlineUsers = await User.find({ isOnline: true });
            const userList = onlineUsers.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                avatar: u.avatar
            }));

            io.emit('user_list', userList);
            io.emit('user_count', onlineUsers.length);
        } catch (err) {
            console.error("Error registering user:", err);
        }
    });

    socket.on('send_message', async (data) => {
        try {
            // Save to DB
            const savedMsg = await Message.create({
                text: data.text,
                sender: data.user.id as any,
                isPrivate: false
            });
            // Populate sender to return full object
            await savedMsg.populate('sender');

            const newMessage: MessageType = {
                id: savedMsg.id,
                text: savedMsg.text,
                user: {
                    id: (savedMsg.sender as any).id,
                    name: (savedMsg.sender as any).name,
                    email: (savedMsg.sender as any).email,
                    avatar: (savedMsg.sender as any).avatar
                },
                createdAt: savedMsg.createdAt.toISOString(),
            };

            // Broadcast to all clients
            io.emit('receive_message', newMessage);
            console.log(`Global Message from ${(savedMsg.sender as any).name}: ${savedMsg.text}`);
        } catch (err) {
            console.error("Error sending message:", err);
        }
    });

    socket.on('send_private_message', async (data) => {
        try {
            const recipientUser = await User.findById(data.toUserId);
            const currentUserId = activeUsers.get(socket.id)?.userId;

            if (recipientUser && currentUserId) {
                // Save to DB
                const savedMsg = await Message.create({
                    text: data.text,
                    sender: currentUserId as any,
                    recipient: data.toUserId as any,
                    isPrivate: true,
                    isRead: false
                });
                await savedMsg.populate('sender');

                const newMessage: MessageType = {
                    id: savedMsg.id,
                    text: savedMsg.text,
                    user: {
                        id: (savedMsg.sender as any).id,
                        name: (savedMsg.sender as any).name,
                        email: (savedMsg.sender as any).email,
                        avatar: (savedMsg.sender as any).avatar
                    },
                    createdAt: savedMsg.createdAt.toISOString(),
                };

                // Send to the recipient if online
                if (recipientUser.socketId) {
                    io.to(recipientUser.socketId).emit('receive_private_message', {
                        ...newMessage,
                        fromUserId: currentUserId,
                        toUserId: data.toUserId
                    });

                    // Notify sender that message was delivered
                    socket.emit('message_delivered', {
                        messageId: savedMsg.id,
                        toUserId: data.toUserId
                    });

                    // Send updated unread count to recipient (only count messages from current sender)
                    const unreadCount = await Message.countDocuments({
                        sender: currentUserId,
                        recipient: data.toUserId,
                        isRead: false,
                        isPrivate: true
                    });

                    io.to(recipientUser.socketId).emit('unread_count_update', {
                        fromUserId: currentUserId,
                        count: unreadCount
                    });
                }

                // Send back to sender so they see it in their UI
                socket.emit('receive_private_message', {
                    ...newMessage,
                    fromUserId: currentUserId,
                    toUserId: data.toUserId
                });

                console.log(`Private Message from ${(savedMsg.sender as any).name} to ${recipientUser.name}: ${savedMsg.text}`);
            } else {
                console.log(`User ${data.toUserId} not found for private message or sender not identified.`);
            }
        } catch (err) {
            console.error("Error sending private message:", err);
        }
    });

    socket.on('typing', (isTyping) => {
        // Broadcast typing status to everyone except the sender
        socket.broadcast.emit('typing_indicator', socket.id, isTyping);
    });

    socket.on('typing_private', async ({ toUserId, isTyping }) => {
        const recipientUser = await User.findById(toUserId);
        if (recipientUser && recipientUser.socketId) {
            io.to(recipientUser.socketId).emit('typing_indicator_private', {
                fromUserId: activeUsers.get(socket.id)?.userId || '',
                isTyping
            });
        }
    });

    socket.on('mark_messages_read', async ({ otherUserId }) => {
        const currentUserId = activeUsers.get(socket.id)?.userId;
        if (!currentUserId) return;

        try {
            // Update DB
            await Message.updateMany(
                { sender: otherUserId, recipient: currentUserId, isRead: false },
                { isRead: true }
            );

            // Notify the sender (otherUser) that their messages were read
            const senderUser = await User.findById(otherUserId);
            if (senderUser && senderUser.socketId) {
                io.to(senderUser.socketId).emit('messages_read_update', {
                    readByUserId: currentUserId
                });
            }

            // Send updated unread count back to the current user (should be 0 now)
            socket.emit('unread_count_update', {
                fromUserId: otherUserId,
                count: 0
            });
        } catch (err) {
            console.error("Error marking messages as read:", err);
        }
    });

    socket.on('disconnect', async () => {
        console.log(`Socket disconnected: ${socket.id}`);

        const activeUser = activeUsers.get(socket.id);
        if (activeUser) {
            try {
                // Determine if this was the user's only socket, or just update status
                const user = await User.findById(activeUser.userId);

                // Only mark offline if the disconnecting socket is the CURRENT one in DB
                // This handles the race condition where a user reconnects (new socket) 
                // before the old socket disconnects.
                if (user && user.socketId === socket.id) {
                    user.isOnline = false;
                    user.socketId = undefined;
                    await user.save();
                    console.log(`User marked offline: ${user.name}`);
                } else {
                    console.log(`User ${user?.name} disconnected but stays online (new socket exists)`);
                }

                activeUsers.delete(socket.id);

                // Broadcast updated list
                const onlineUsers = await User.find({ isOnline: true });
                const userList = onlineUsers.map(u => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    avatar: u.avatar
                }));
                io.emit('user_list', userList);
                io.emit('user_count', onlineUsers.length);
            } catch (err) {
                console.error("Error handling disconnect:", err);
            }
        }
    });

    socket.on('request_user_list', async () => {
        try {
            const onlineUsers = await User.find({ isOnline: true });
            const userList = onlineUsers.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                avatar: u.avatar
            }));
            socket.emit('user_list', userList);
        } catch (err) {
            console.error("Error fetching user list:", err);
        }
    });

    socket.on('get_unread_counts', async () => {
        const currentUserId = activeUsers.get(socket.id)?.userId;
        if (!currentUserId) return;

        try {
            // Get all unread messages for this user, grouped by sender
            const unreadMessages = await Message.aggregate([
                {
                    $match: {
                        recipient: currentUserId,
                        isPrivate: true,
                        isRead: false
                    }
                },
                {
                    $group: {
                        _id: '$sender',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const unreadCounts = unreadMessages.map(item => ({
                userId: item._id.toString(),
                count: item.count
            }));

            socket.emit('unread_counts', unreadCounts);
        } catch (err) {
            console.error("Error fetching unread counts:", err);
        }
    });

    socket.on("error", (error) => {
        console.error("Socket error", error);
    });
});

app.get('/', (req, res) => {
    res.send('LiveBoard Backend is running!');
});

app.get('/messages', async (req, res) => {
    try {
        const msgs = await Message.find({ isPrivate: false }).sort({ createdAt: -1 }).limit(100).populate('sender');
        const history = msgs.reverse().map(m => ({
            id: m.id,
            text: m.text,
            user: {
                id: (m.sender as any).id,
                name: (m.sender as any).name,
                email: (m.sender as any).email,
                avatar: (m.sender as any).avatar
            },
            createdAt: m.createdAt.toISOString()
        }));
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

server.listen(PORT, () => {
    // added the current IP address to the console log
    const ip = os.networkInterfaces().en0?.[0].address;
    console.log(`Server is running on http://${ip}:${PORT}`);
});
