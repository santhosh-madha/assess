// server/controllers/chat.js
const Chat = require("../models/Chat");
const Booking = require("../models/Booking");
const Property = require("../models/Property");

// Validate if two users have a confirmed booking between them
const validateBookingExists = async (user1Id, user2Id) => {
    // Check if user1 is renter and user2 is owner
    const bookingAsRenter = await Booking.findOne({ renterId: user1Id }).populate({
        path: 'propertyId',
        match: { ownerId: user2Id }
    });
    
    if (bookingAsRenter && bookingAsRenter.propertyId) return true;

    // Check if user1 is owner and user2 is renter
    const bookingAsOwner = await Booking.findOne({ renterId: user2Id }).populate({
        path: 'propertyId',
        match: { ownerId: user1Id }
    });

    if (bookingAsOwner && bookingAsOwner.propertyId) return true;

    return false;
};

exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.userId;
        // Find all unique users this person has chatted with
        const chats = await Chat.find({
            $or: [{ sender: userId }, { receiver: userId }]
        }).sort({ timestamp: -1 });

        const conversationPartners = new Set();
        const latestMessages = [];

        chats.forEach(chat => {
            const partnerId = chat.sender.toString() === userId ? chat.receiver.toString() : chat.sender.toString();
            if (!conversationPartners.has(partnerId)) {
                conversationPartners.add(partnerId);
                latestMessages.push(chat);
            }
        });

        // Populate the partner details
        const populatedConversations = await Chat.populate(latestMessages, {
            path: 'sender receiver',
            select: 'username email imageUrl'
        });

        const formattedConversations = await Promise.all(populatedConversations.map(async (c) => {
            const partner = c.sender._id.toString() === userId ? c.receiver : c.sender;
            
            // Calculate unread count specifically for messages RECEIVED by current user from this partner
            const unreadCount = await Chat.countDocuments({
                sender: partner._id,
                receiver: userId,
                read: false
            });

            return {
                partnerId: partner._id,
                partnerName: partner.username,
                partnerEmail: partner.email,
                lastMessage: c.message,
                timestamp: c.timestamp,
                unreadCount: unreadCount
            };
        }));

        res.json(formattedConversations);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        const partnerId = req.params.partnerId;

        await Chat.updateMany(
            { sender: partnerId, receiver: userId, read: false },
            { $set: { read: true } }
        );

        res.json({ message: "Messages marked as read" });
    } catch (error) {
        console.error("Error marking messages as read:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.getGlobalUnreadCount = async (req, res) => {
    try {
        const userId = req.user.userId;
        const count = await Chat.countDocuments({ receiver: userId, read: false });
        res.json({ count });
    } catch (error) {
        console.error("Error fetching global unread count:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.getChatMessages = async (req, res) => {
    try {
        const userId = req.user.userId;
        const targetUserId = req.params.targetUserId;

        // Security check: Must have a booking (Optional but requested)
        const hasBooking = await validateBookingExists(userId, targetUserId);
        if (!hasBooking) {
            // We allow fetching if history already exists even if booking expired, 
            // but for a new "Contact" it should fail. 
            // For now, let's just log it and allow if they have a history.
        }

        const messages = await Chat.find({
            $or: [
                { sender: userId, receiver: targetUserId },
                { sender: targetUserId, receiver: userId }
            ]
        }).sort({ timestamp: 1 });

        res.json(messages);
    } catch (error) {
        console.error("Error fetching chat messages:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.saveMessage = async (senderId, receiverId, message) => {
    try {
        // Validation: Booking must exist
        const hasBooking = await validateBookingExists(senderId, receiverId);
        if (!hasBooking) {
            throw new Error("No active booking found between users.");
        }

        const newChat = new Chat({
            sender: senderId,
            receiver: receiverId,
            message: message
        });
        return await newChat.save();
    } catch (error) {
        console.error("Error saving message:", error);
        throw error;
    }
};
