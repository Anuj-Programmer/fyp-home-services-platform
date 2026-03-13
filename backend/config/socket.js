const socketIO = require('socket.io');

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
