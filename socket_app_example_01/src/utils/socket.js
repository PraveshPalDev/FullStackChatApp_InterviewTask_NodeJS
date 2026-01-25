import { io } from 'socket.io-client';

const SOCKET_URL = 'http://192.168.0.102:4000';
let socket = null;


export const connectSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            transports: ['websocket'],
            forceNew: true,
            autoConnect: true,
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
        });

        socket.on('disconnect', reason => {
            console.log('Socket disconnected:', reason);
        });

        socket.on('connect_error', error => {
            console.log('Socket error:', error.message);
        });
    }
};


export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('🔌 Socket manually disconnected');
    }
};


export const getSocket = () => socket;
