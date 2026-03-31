// server/controllers/chat.js
const Chat = require('../models/Chat');
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const User = require('../models/User');

// -----------------------------------------------------------------------
// FIXED: Proper two-step lookup instead of broken populate+match pattern
// populate({ match }) only nullifies the field, it doesn't filter the
// parent document. So we fetch the property IDs owned by user2 first,
// then check if a paid booking links user1 + those properties.
// -----------------------------------------------------------------------
const validateBookingExists = async (user1Id, user2Id) => {
    // Scenario A: user1 is renter, user2 is owner
    const propsOwnedByUser2 = await Property.find({ ownerId: user2Id }).select('_id');
    const propIdsA = propsOwnedByUser2.map(p => p._id);
    if (propIdsA.length > 0) {
        const bookingA = await Booking.findOne({
            renterId: user1Id,
            propertyId: { $in: propIdsA },
            paymentStatus: 'paid'
        });
        if (bookingA) return true;
    }

    // Scenario B: user1 is owner, user2 is renter
    const propsOwnedByUser1 = await Property.find({ ownerId: user1Id }).select('_id');
    const propIdsB = propsOwnedByUser1.map(p => p._id);
    if (propIdsB.length > 0) {
        const bookingB = await Booking.findOne({
            renterId: user2Id,
            propertyId: { $in: propIdsB },
            paymentStatus: 'paid'
        });
        if (bookingB) return true;
    }

    return false;
};

// FIXED: Get property context using proper two-step lookup
const getPropertyContext = async (userId, partnerId) => {
    try {
        // Check if userId is renter, partnerId is owner
        const propsOfPartner = await Property.find({ ownerId: partnerId }).select('_id title');
        if (propsOfPartner.length > 0) {
            const b = await Booking.findOne({
                renterId: userId,
                propertyId: { $in: propsOfPartner.map(p => p._id) },
                paymentStatus: 'paid'
            });
            if (b) {
                const prop = propsOfPartner.find(p => p._id.toString() === b.propertyId.toString());
                return prop ? prop.title : null;
            }
        }

        // Check if partnerId is renter, userId is owner
        const propsOfUser = await Property.find({ ownerId: userId }).select('_id title');
        if (propsOfUser.length > 0) {
            const b = await Booking.findOne({
                renterId: partnerId,
                propertyId: { $in: propsOfUser.map(p => p._id) },
                paymentStatus: 'paid'
            });
            if (b) {
                const prop = propsOfUser.find(p => p._id.toString() === b.propertyId.toString());
                return prop ? prop.title : null;
            }
        }
    } catch (e) {
        console.error('getPropertyContext error:', e.message);
    }
    return null;
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
            const partnerId = chat.sender.toString() === userId
                ? chat.receiver.toString()
                : chat.sender.toString();
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

            const propertyContext = await getPropertyContext(userId, partner._id.toString());

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

        const propertyContext = await getPropertyContext(userId, targetUserId);

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
            throw new Error("No confirmed booking found between these users.");
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
