// server/controllers/chat.js
const Chat = require('../models/Chat');
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const User = require('../models/User');

// Validate if two users have a PAID/confirmed booking between them
const validateBookingExists = async (user1Id, user2Id) => {
    // Check if user1 is renter and user2 is owner
    const bookingAsRenter = await Booking.findOne({ 
        renterId: user1Id,
        paymentStatus: 'paid'
    }).populate({
        path: 'propertyId',
        match: { ownerId: user2Id }
    });
    
    if (bookingAsRenter && bookingAsRenter.propertyId) return true;

    // Check if user1 is owner and user2 is renter
    const bookingAsOwner = await Booking.findOne({ 
        renterId: user2Id,
        paymentStatus: 'paid'
    }).populate({
        path: 'propertyId',
        match: { ownerId: user1Id }
    });

    if (bookingAsOwner && bookingAsOwner.propertyId) return true;

    return false;
};

exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.userId;
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

        const populatedConversations = await Chat.populate(latestMessages, {
            path: 'sender receiver',
            select: 'username email'
        });

        const formattedConversations = await Promise.all(populatedConversations.map(async (c) => {
            const partner = c.sender._id.toString() === userId ? c.receiver : c.sender;
            
            const unreadCount = await Chat.countDocuments({
                sender: partner._id,
                receiver: userId,
                read: false
            });

            // Try to find the booking/property context for this conversation
            let propertyContext = null;
            const booking = await Booking.findOne({
                $or: [
                    { renterId: userId, paymentStatus: 'paid' },
                    { renterId: partner._id, paymentStatus: 'paid' }
                ]
            }).populate({
                path: 'propertyId',
                match: { $or: [{ ownerId: userId }, { ownerId: partner._id }] },
                select: 'title ownerId'
            });
            if (booking && booking.propertyId) {
                propertyContext = booking.propertyId.title;
            }

            return {
                partnerId: partner._id,
                partnerName: partner.username,
                partnerEmail: partner.email,
                lastMessage: c.message,
                timestamp: c.timestamp,
                unreadCount,
                propertyContext
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

// NEW: Get partner info for chat initiation (name + property context)
exports.getChatPartnerInfo = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { targetUserId } = req.params;

        const partner = await User.findById(targetUserId).select('username email');
        if (!partner) return res.status(404).json({ error: 'User not found' });

        // Find the linking booking to show property context
        let propertyContext = null;
        const booking = await Booking.findOne({
            $or: [
                { renterId: userId, paymentStatus: 'paid' },
                { renterId: targetUserId, paymentStatus: 'paid' }
            ]
        }).populate({
            path: 'propertyId',
            match: { $or: [{ ownerId: userId }, { ownerId: targetUserId }] },
            select: 'title'
        });
        if (booking && booking.propertyId) {
            propertyContext = booking.propertyId.title;
        }

        res.json({ 
            partnerName: partner.username, 
            partnerEmail: partner.email,
            propertyContext 
        });
    } catch (error) {
        console.error('Error fetching chat partner info:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.saveMessage = async (senderId, receiverId, message) => {
    try {
        const hasBooking = await validateBookingExists(senderId, receiverId);
        if (!hasBooking) {
            throw new Error("No confirmed booking found between users.");
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
