const Conversation = require('../models/conversationModel');

const findOrCreateConversation = async ({ userId, technicianId, bookingId }) => {
  let conversation = await Conversation.findOne({
    user_id: userId,
    technician_id: technicianId,
  });

  if (!conversation) {
    try {
      conversation = await Conversation.create({
        user_id: userId,
        technician_id: technicianId,
        booking_ids: bookingId ? [bookingId] : [],
      });
    } catch (error) {
      if (error?.code === 11000) {
        conversation = await Conversation.findOne({
          user_id: userId,
          technician_id: technicianId,
        });
      } else {
        throw error;
      }
    }

    if (!conversation) {
      throw new Error('Unable to create conversation');
    }

    return conversation;
  }

  if (bookingId && !conversation.booking_ids.some((id) => String(id) === String(bookingId))) {
    conversation.booking_ids.push(bookingId);
    await conversation.save();
  }

  return conversation;
};

module.exports = { findOrCreateConversation };
