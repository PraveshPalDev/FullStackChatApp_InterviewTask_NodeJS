import express from 'express';
import { register, login, getUsers, getMessages, sendMessage, deleteMessage, updateMessage } from '../controllers/authController';

const router = express.Router();

// Register
router.post('/register', register);

// Login
router.post('/login', login);

// Get All Users (for Contacts list)
router.get('/users', getUsers);

// Get Messages
router.get('/messages/:userId', getMessages);

// Send Message
router.post('/messages', sendMessage);

// Delete Message
router.delete('/messages/:messageId', deleteMessage);

// Update Message
router.put('/messages/:messageId', updateMessage);


export default router;
