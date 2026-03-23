import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import Cookies from 'js-cookie';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);
  const notificationsHydratedRef = useRef(false);

  useEffect(() => {
    // Initialize socket connection
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080';
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection handlers
    newSocket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      setIsConnected(true);
      
      // Auto-register user if logged in
      const userId = localStorage.getItem('userId') || Cookies.get('userId');
      if (userId) {
        newSocket.emit('register', userId);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Listen for booking notifications
    newSocket.on('booking:notification', (data) => {
      console.log('📬 Booking notification:', data);
      setNotifications(prev => [{
        id: Date.now(),
        ...data,
        timestamp: new Date(),
        read: false
      }, ...prev]);
    });

    // Listen for admin notifications
    newSocket.on('admin:notification', (data) => {
      console.log('📢 Admin notification:', data);
      setNotifications(prev => [{
        id: Date.now(),
        type: 'ADMIN',
        ...data,
        timestamp: new Date(),
        read: false
      }, ...prev]);
    });

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Register user with socket only; user fetching is handled by UserContext.
  const registerUser = useCallback((userId) => {
    if (socketRef.current && userId) {
      socketRef.current.emit('register', userId);
      localStorage.setItem('userId', userId);
      console.log('👤 User registered with socket:', userId);
    }
  }, []);

  useEffect(() => {
    if (notificationsHydratedRef.current) return;

    const token = Cookies.get('token') || localStorage.getItem('token');
    if (!token) return;

    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    try {
      const parsedUser = JSON.parse(storedUser);
      const initialNotifications = Array.isArray(parsedUser?.notification)
        ? parsedUser.notification.map((notif) => ({
            id: notif._id || Date.now(),
            ...notif,
            timestamp: new Date(notif.createdAt || notif.date || Date.now()),
          }))
        : [];

      if (initialNotifications.length > 0) {
        setNotifications(initialNotifications);
        console.log('📥 Loaded initial notifications from cache:', initialNotifications.length);
      }
    } catch (error) {
      console.error('Invalid user data in storage while hydrating notifications', error);
    } finally {
      notificationsHydratedRef.current = true;
    }
  }, []);

  // Emit new booking event
  const emitNewBooking = (bookingData) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('booking:new', bookingData);
    }
  };

  // Emit booking status update
  const emitBookingStatusUpdate = (updateData) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('booking:statusUpdate', updateData);
    }
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Remove specific notification
  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const value = {
    socket: socketRef.current,
    isConnected,
    notifications,
    registerUser,
    emitNewBooking,
    emitBookingStatusUpdate,
    clearNotifications,
    removeNotification
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
