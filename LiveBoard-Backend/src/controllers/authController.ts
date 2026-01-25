import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import fs from 'fs';
import path from 'path';
import Message from '../models/Message';

export const register = async (req: Request, res: Response) => {
    const { name, email, password, avatar } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        let avatarUrl = '';
        if (avatar && avatar.startsWith('data:image')) {
            try {
                // Extract base64 data
                const matches = avatar.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    const type = matches[1];
                    const data = Buffer.from(matches[2], 'base64');
                    const extension = type.split('/')[1];
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;

                    // Create directory if not exists
                    const uploadDir = path.join(__dirname, '../public/uploads/avatars');
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }

                    // Save file
                    const filePath = path.join(uploadDir, fileName);
                    fs.writeFileSync(filePath, data);

                    // Create URL - Return relative path, let frontend handle base URL
                    avatarUrl = `/uploads/avatars/${fileName}`;
                }
            } catch (err) {
                console.error('Error saving avatar:', err);
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            avatar: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
        });


        res.status(201).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar
            },

        });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user || !user.password) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar
            },
            token
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        let currentUserId = null;

        // Try to get current user from token
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
                currentUserId = decoded.id;
            } catch (err) {
                // Invalid token, treat as guest/generic
            }
        }

        // Fetch all users except self
        const query = currentUserId ? { _id: { $ne: currentUserId } } : {};
        const users = await User.find(query, 'name email avatar isOnline');

        // If no user context, just return basic info
        if (!currentUserId) {
            const basicUsers = users.map(user => ({
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                lastMessage: '',
                time: '',
                unreadCount: 0,
                isRead: true,
                isOnline: user.isOnline
            }));
            return res.json(basicUsers);
        }

        // Fetch user chat interactions
        const formattedUsers = await Promise.all(users.map(async (user) => {
            // Get last message between current user and this user
            const lastMsg = await Message.findOne({
                $or: [
                    { sender: currentUserId, recipient: user.id },
                    { sender: user.id, recipient: currentUserId }
                ]
            }).sort({ createdAt: -1 });

            // Get unread count (messages sent BY this user TO current user)
            const unreadCount = await Message.countDocuments({
                sender: user.id,
                recipient: currentUserId,
                isRead: false
            });

            let timeString = '';
            if (lastMsg && lastMsg.createdAt) {
                const date = new Date(lastMsg.createdAt);
                timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            return {
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                lastMessage: lastMsg ? lastMsg.text : '',
                time: timeString,
                unreadCount: unreadCount,
                isRead: lastMsg ? lastMsg.isRead : true,
                isOnline: user.isOnline
            };
        }));

        // Sort by users who have recent messages first
        formattedUsers.sort((a, b) => {
            if (a.time && !b.time) return -1;
            if (!a.time && b.time) return 1;
            if (!a.time && !b.time) return 0;
            // Simple string comparison for time isn't perfect but works for simple listing, 
            // ideally we'd carry the timestamps. For now, strict 'latest' sorting might strictly require the Date obj.
            // But existing list usually appends non-messaged users at bottom.
            return 0;
        });

        res.json(formattedUsers);
    } catch (err) {
        console.error('Get Users Error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const getMessages = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params; // The other user's ID
        let currentUserId = null;

        // Get current user from token
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
                currentUserId = decoded.id;
            } catch (err) {
                return res.status(401).json({ error: 'Invalid token' });
            }
        }

        if (!currentUserId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Fetch messages between current user and specified user
        const messages = await Message.find({
            $or: [
                { sender: currentUserId, recipient: userId },
                { sender: userId, recipient: currentUserId }
            ]
        })
            .sort({ createdAt: 1 }) // Oldest first for chat history
            .populate('sender', 'name email avatar')
            .populate('recipient', 'name email avatar');

        // Transform for client
        const history = messages.map(m => ({
            id: m.id,
            text: m.text,
            isPrivate: m.isPrivate,
            isRead: m.isRead,
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
        console.error('Get Messages Error:', err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { recipientId, text } = req.body;
        let currentUserId = null;

        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
                currentUserId = decoded.id;
            } catch (err) {
                return res.status(401).json({ error: 'Invalid token' });
            }
        }

        if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });

        const savedMsg = await Message.create({
            text,
            sender: currentUserId,
            recipient: recipientId,
            isPrivate: true,
            isRead: false
        });

        await savedMsg.populate('sender', 'name email avatar');

        res.status(201).json({
            id: savedMsg.id,
            text: savedMsg.text,
            isPrivate: savedMsg.isPrivate,
            isRead: savedMsg.isRead,
            user: savedMsg.sender,
            createdAt: savedMsg.createdAt
        });
    } catch (err) {
        console.error('Send Message Error:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

export const deleteMessage = async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;
        let currentUserId = null;

        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
                currentUserId = decoded.id;
            } catch (err) {
                return res.status(401).json({ error: 'Invalid token' });
            }
        }

        if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });

        const msg = await Message.findOne({ _id: messageId, sender: currentUserId });
        if (!msg) {
            return res.status(404).json({ error: 'Message not found or unauthorized' });
        }

        await Message.deleteOne({ _id: messageId });
        res.json({ message: 'Message deleted successfully' });
    } catch (err) {
        console.error('Delete Message Error:', err);
        res.status(500).json({ error: 'Failed to delete message' });
    }
};

export const updateMessage = async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;
        const { text } = req.body;
        let currentUserId = null;

        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
                currentUserId = decoded.id;
            } catch (err) {
                return res.status(401).json({ error: 'Invalid token' });
            }
        }

        if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });

        const msg = await Message.findOne({ _id: messageId, sender: currentUserId });
        if (!msg) {
            return res.status(404).json({ error: 'Message not found or unauthorized' });
        }

        msg.text = text;
        await msg.save();
        res.json({ message: 'Message updated successfully', text: msg.text });
    } catch (err) {
        console.error('Update Message Error:', err);
        res.status(500).json({ error: 'Failed to update message' });
    }
};
