const express = require('express');
const authMiddleware = require('../middleware/authmiddleware');
const { findOrCreateConversation, getConversationMessages } = require('../controllers/chatCtrl');

const router = express.Router();

router.post('/conversations/find-or-create', authMiddleware, findOrCreateConversation);
router.get('/conversations/:conversationId/messages', authMiddleware, getConversationMessages);

module.exports = router;
