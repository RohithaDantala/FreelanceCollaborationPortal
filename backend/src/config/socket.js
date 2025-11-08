// ============================================
// FILE 6: frontend/src/services/socket.js - FIX
// ============================================
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 
                   'https://freelancer-collaboration-portal.onrender.com';

let socket = null;

export const initializeSocket = (token) => {
  if (!token) {
    console.error('❌ Cannot initialize socket without token');
    return null;
  }

  if (socket?.connected) {
    console.log('✅ Socket already connected');
    return socket;
  }

  console.log('🔌 Connecting to socket:', SOCKET_URL);

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('🔌 Disconnecting socket');
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;