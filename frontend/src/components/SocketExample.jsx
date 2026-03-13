import React, { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Example component showing how to use WebSocket
 * 
 * USAGE IN YOUR COMPONENTS:
 * 
 * 1. Import the hook:
 *    import { useSocket } from '../context/SocketContext';
 * 
 * 2. Use in component:
 *    const { isConnected, notifications, registerUser, emitNewBooking } = useSocket();
 * 
 * 3. Register user after login:
 *    registerUser(userId);
 * 
 * 4. Emit events:
 *    emitNewBooking({ technicianId, userId, bookingData });
 */

const SocketExample = () => {
  const { 
    isConnected, 
    notifications, 
    registerUser,
    emitNewBooking,
    emitBookingStatusUpdate,
    clearNotifications,
    removeNotification
  } = useSocket();

  useEffect(() => {
    // Example: Register user when component mounts
    const userId = localStorage.getItem('userId');
    if (userId) {
      registerUser(userId);
    }
  }, []);

  // Example: Handle new booking
  const handleCreateBooking = () => {
    const bookingData = {
      technicianId: 'tech123',
      userId: 'user456',
      serviceDate: new Date(),
      // ... other booking data
    };
    
    emitNewBooking(bookingData);
  };

  // Example: Update booking status
  const handleUpdateStatus = () => {
    emitBookingStatusUpdate({
      bookingId: 'booking123',
      userId: 'user456',
      status: 'accepted'
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">WebSocket Status</h2>
      
      {/* Connection Status */}
      <div className="mb-4">
        <span className={`inline-block px-3 py-1 rounded ${isConnected ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          {isConnected ? '✅ Connected' : '❌ Disconnected'}
        </span>
      </div>

      {/* Notifications */}
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-2">
          Notifications ({notifications.length})
        </h3>
        
        {notifications.length > 0 && (
          <button 
            onClick={clearNotifications}
            className="mb-2 px-3 py-1 bg-blue-500 text-white rounded"
          >
            Clear All
          </button>
        )}

        <div className="space-y-2">
          {notifications.map((notif) => (
            <div 
              key={notif.id} 
              className="p-3 bg-gray-100 rounded border-l-4 border-blue-500"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{notif.type}</p>
                  <p>{notif.message}</p>
                  <p className="text-sm text-gray-500">
                    {notif.timestamp?.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => removeNotification(notif.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Example Actions */}
      <div className="space-x-2">
        <button 
          onClick={handleCreateBooking}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Test: Create Booking
        </button>
        <button 
          onClick={handleUpdateStatus}
          className="px-4 py-2 bg-yellow-500 text-white rounded"
        >
          Test: Update Status
        </button>
      </div>
    </div>
  );
};

export default SocketExample;

/**
 * HOW TO USE IN DIFFERENT SCENARIOS:
 * 
 * 1. AFTER USER LOGIN (LoginPage.jsx, VerifyLoginOtp.jsx):
 *    const { registerUser } = useSocket();
 *    
 *    // After successful login
 *    registerUser(userData._id);
 * 
 * 2. CREATING A BOOKING (Booking.jsx, BookTechnicianPage.jsx):
 *    const { emitNewBooking } = useSocket();
 *    
 *    // After booking is created via API
 *    emitNewBooking({
 *      technicianId: booking.technician,
 *      userId: booking.user,
 *      bookingId: booking._id,
 *      ...bookingDetails
 *    });
 * 
 * 3. TECHNICIAN ACCEPTING/REJECTING BOOKING (TechnicianBookings.jsx):
 *    const { emitBookingStatusUpdate } = useSocket();
 *    
 *    // After status update via API
 *    emitBookingStatusUpdate({
 *      bookingId: booking._id,
 *      userId: booking.user,
 *      status: 'accepted' // or 'rejected'
 *    });
 * 
 * 4. SHOWING NOTIFICATIONS (Navbar.jsx or any component):
 *    const { notifications, removeNotification } = useSocket();
 *    
 *    return (
 *      <div>
 *        <Badge count={notifications.length}>
 *          <BellIcon />
 *        </Badge>
 *        
 *        <NotificationList>
 *          {notifications.map(notif => (
 *            <NotificationItem key={notif.id} {...notif} />
 *          ))}
 *        </NotificationList>
 *      </div>
 *    );
 * 
 * 5. ADMIN PANEL (AdminPanel.jsx, APBookings.jsx):
 *    const { notifications, isConnected } = useSocket();
 *    
 *    // Listen for all booking updates
 *    // Notifications will automatically update when events occur
 * 
 * 6. REAL-TIME BOOKING LIST:
 *    const { notifications } = useSocket();
 *    
 *    useEffect(() => {
 *      // Filter booking-related notifications
 *      const bookingNotifs = notifications.filter(n => 
 *        n.type === 'NEW_BOOKING' || n.type === 'BOOKING_STATUS_UPDATE'
 *      );
 *      
 *      // Refresh booking list or update state
 *      if (bookingNotifs.length > 0) {
 *        fetchBookings(); // Refresh data
 *      }
 *    }, [notifications]);
 */
