// server/routers/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat');
const { authenticateUser } = require('../middleware/auth');

// Get all active conversations for the current user
router.get('/conversations', authenticateUser, chatController.getConversations);

// Get global unread message count
router.get('/unread-count', authenticateUser, chatController.getGlobalUnreadCount);

// Get chat history with a specific user
router.get('/history/:targetUserId', authenticateUser, chatController.getChatMessages);

// Mark a conversation as read
router.put('/read/:partnerId', authenticateUser, chatController.markAsRead);

module.exports = router;
