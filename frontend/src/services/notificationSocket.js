// frontend/src/services/notificationSocket.js - FIXED VERSION
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://freelancer-collaboration-portal.onrender.com';

let notificationSocket = null;

export const initializeNotificationSocket = (token, onNotification) => {
  if (!token) {
    console.error('❌ Cannot initialize notification socket without token');
    return null;
  }

  if (notificationSocket?.connected) {
    console.log('✅ Notification socket already connected');
    return notificationSocket;
  }

  console.log('🔔 Connecting to notification socket:', `${SOCKET_URL}/notifications`);

  // Connect to the /notifications namespace
  notificationSocket = io(`${SOCKET_URL}/notifications`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    timeout: 20000,
  });

  notificationSocket.on('connect', () => {
    console.log('✅ Notification socket connected:', notificationSocket.id);
  });

  notificationSocket.on('new_notification', (notification) => {
    console.log('🔔 New notification received:', notification);
    if (onNotification) {
      onNotification(notification);
    }

    // Also play a sound (optional)
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Could not play notification sound'));
    } catch (e) {
      // Ignore sound errors
    }
  });

  notificationSocket.on('connect_error', (error) => {
    console.error('❌ Notification socket connection error:', error.message);
  });

  notificationSocket.on('disconnect', (reason) => {
    console.log('🔌 Notification socket disconnected:', reason);
    
    // Auto-reconnect if disconnected unexpectedly
    if (reason === 'io server disconnect') {
      // Server initiated disconnect, try to reconnect
      notificationSocket.connect();
    }
  });

  notificationSocket.on('error', (error) => {
    console.error('❌ Notification socket error:', error);
  });

  notificationSocket.on('reconnect', (attemptNumber) => {
    console.log(`🔄 Notification socket reconnected after ${attemptNumber} attempts`);
  });

  notificationSocket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`🔄 Attempting to reconnect... (attempt ${attemptNumber})`);
  });

  notificationSocket.on('reconnect_error', (error) => {
    console.error('❌ Reconnection error:', error.message);
  });

  notificationSocket.on('reconnect_failed', () => {
    console.error('❌ Failed to reconnect notification socket');
  });

  return notificationSocket;
};

export const disconnectNotificationSocket = () => {
  if (notificationSocket) {
    console.log('🔌 Disconnecting notification socket');
    notificationSocket.disconnect();
    notificationSocket = null;
  }
};

export const getNotificationSocket = () => notificationSocket;