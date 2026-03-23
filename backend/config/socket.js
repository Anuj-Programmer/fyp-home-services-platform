const socketIO = require('socket.io');
const Conversation = require('../models/conversationModel');
const ChatMessage = require('../models/chatMessageModel');

const isConversationParticipant = (conversation, userId) => {
  const uid = String(userId);
  return String(conversation.user_id) === uid || String(conversation.technician_id) === uid;
};

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Store online users
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`.green);

    // User registers with their ID
    socket.on('register', (userId) => {
      if (userId) {
        onlineUsers.set(userId, socket.id);
        socket.userId = userId;
        socket.join(`user_${userId}`);
        console.log(`👤 User ${userId} registered with socket ${socket.id}`.cyan);
        
        // Notify others that user is online
        socket.broadcast.emit('user:online', { userId });
      }
    });

    // Booking events
    socket.on('booking:new', (data) => {
      // Broadcast to technician
      if (data.technicianId) {
        io.to(`user_${data.technicianId}`).emit('booking:notification', {
          type: 'NEW_BOOKING',
          message: 'You have a new booking request',
          data: data
        });
      }
    });

    socket.on('booking:statusUpdate', (data) => {
      // Notify the user about booking status change
      if (data.userId) {
        io.to(`user_${data.userId}`).emit('booking:notification', {
          type: 'BOOKING_STATUS_UPDATE',
          message: `Your booking has been ${data.status}`,
          data: data
        });
        console.log(`📤 Sent booking update to user ${data.userId}: ${data.status}`.blue);
      }
      
      // Also notify technician if present (e.g., when user cancels)
      if (data.technicianId) {
        io.to(`user_${data.technicianId}`).emit('booking:notification', {
          type: 'BOOKING_STATUS_UPDATE',
          message: `Booking has been ${data.status}`,
          data: data
        });
        console.log(`📤 Sent booking update to technician ${data.technicianId}: ${data.status}`.blue);
      }
    });

    // Join chat room by conversation id
    socket.on('join_room', async (payload = {}) => {
      try {
        const conversationId = payload.conversation_id;
        const senderId = socket.userId;

        if (!conversationId || !senderId) {
          socket.emit('chat:error', { message: 'Invalid chat room request' });
          return;
        }

        const conversation = await Conversation.findById(conversationId).select('user_id technician_id');
        if (!conversation) {
          socket.emit('chat:error', { message: 'Conversation not found' });
          return;
        }

        if (!isConversationParticipant(conversation, senderId)) {
          socket.emit('chat:error', { message: 'You are not allowed in this chat room' });
          return;
        }

        const roomName = `conversation_${conversationId}`;
        socket.join(roomName);
        socket.emit('chat:joined', { conversation_id: conversationId });
      } catch (error) {
        console.error('Error joining chat room:', error);
        socket.emit('chat:error', { message: 'Unable to join chat room' });
      }
    });

    // Persist and broadcast chat message to conversation room
    socket.on('send_message', async (payload = {}) => {
      try {
        const senderId = socket.userId;
        const conversationId = payload.conversation_id;
        const bookingId = payload.booking_id || null;
        const rawMessage = payload.message;

        if (!senderId || !conversationId || typeof rawMessage !== 'string' || !rawMessage.trim()) {
          socket.emit('chat:error', { message: 'Invalid message payload' });
          return;
        }

        const conversation = await Conversation.findById(conversationId).select('user_id technician_id');
        if (!conversation) {
          socket.emit('chat:error', { message: 'Conversation not found' });
          return;
        }

        if (!isConversationParticipant(conversation, senderId)) {
          socket.emit('chat:error', { message: 'You are not allowed to send messages in this conversation' });
          return;
        }

        const newMessage = await ChatMessage.create({
          conversation_id: conversationId,
          booking_id: bookingId,
          sender_id: senderId,
          message: rawMessage.trim(),
          timestamp: new Date(),
        });

        const messagePayload = {
          _id: newMessage._id,
          conversation_id: String(newMessage.conversation_id),
          booking_id: newMessage.booking_id ? String(newMessage.booking_id) : null,
          sender_id: String(newMessage.sender_id),
          message: newMessage.message,
          timestamp: newMessage.timestamp,
        };

        io.to(`conversation_${conversationId}`).emit('receive_message', messagePayload);
      } catch (error) {
        console.error('Error sending chat message:', error);
        socket.emit('chat:error', { message: 'Unable to send message' });
      }
    });

    // Admin notifications
    socket.on('admin:broadcast', (data) => {
      io.emit('admin:notification', data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        socket.broadcast.emit('user:offline', { userId: socket.userId });
        console.log(`👤 User ${socket.userId} disconnected`.yellow);
      }
      console.log(`❌ Client disconnected: ${socket.id}`.red);
    });
  });

  // Helper to emit to specific user
  io.emitToUser = (userId, event, data) => {
    io.to(`user_${userId}`).emit(event, data);
  };

  // Helper to broadcast to all
  io.broadcastAll = (event, data) => {
    io.emit(event, data);
  };

  // Make online users accessible
  io.getOnlineUsers = () => Array.from(onlineUsers.keys());

  return io;
};

module.exports = { initializeSocket };
