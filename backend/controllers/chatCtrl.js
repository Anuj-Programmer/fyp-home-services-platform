const mongoose = require('mongoose');
const Booking = require('../models/bookingModel');
const ChatMessage = require('../models/chatMessageModel');
const Conversation = require('../models/conversationModel');
const { findOrCreateConversation } = require('../utils/conversationService');

const CHAT_ALLOWED_STATUSES = ['confirmed', 'inprogress', 'completed'];

const isBookingParticipant = (booking, userId) => {
  const uid = String(userId);
  return String(booking.user) === uid || String(booking.technician) === uid;
};

const isConversationParticipant = (conversation, userId) => {
  const uid = String(userId);
  return String(conversation.user_id) === uid || String(conversation.technician_id) === uid;
};

exports.findOrCreateConversation = async (req, res) => {
  try {
    const { user_id, technician_id, booking_id } = req.body;
    const requesterId = req.body.userId || req.body.technicianId;

    if (!requesterId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!user_id || !technician_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id and technician_id are required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(user_id) || !mongoose.Types.ObjectId.isValid(technician_id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user_id or technician_id',
      });
    }

    if (String(requesterId) !== String(user_id) && String(requesterId) !== String(technician_id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to create this conversation',
      });
    }

    if (booking_id) {
      if (!mongoose.Types.ObjectId.isValid(booking_id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid booking id',
        });
      }

      const booking = await Booking.findById(booking_id).select('user technician status');

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
      }

      if (!isBookingParticipant(booking, requesterId)) {
        return res.status(403).json({
          success: false,
          message: 'You are not allowed to access this booking chat',
        });
      }

      if (!CHAT_ALLOWED_STATUSES.includes(booking.status)) {
        return res.status(400).json({
          success: false,
          message: 'Chat is available only after booking is confirmed',
        });
      }
    }

    const conversation = await findOrCreateConversation({
      userId: user_id,
      technicianId: technician_id,
      bookingId: booking_id,
    });

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error('Error finding or creating conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Error finding or creating conversation',
      error: error.message,
    });
  }
};

exports.getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const requesterId = req.body.userId || req.body.technicianId;

    if (!requesterId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation id',
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    if (!isConversationParticipant(conversation, requesterId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to access this conversation',
      });
    }

    const messages = await ChatMessage.find({ conversation_id: conversationId }).sort({ timestamp: 1 });

    return res.status(200).json({
      success: true,
      conversationId,
      messages,
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching chat messages',
      error: error.message,
    });
  }
};
