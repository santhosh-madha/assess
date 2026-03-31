// server/controllers/admin.js
const User = require('../models/User');
const Property = require('../models/Property');
const Booking = require('../models/Booking');

// Get Dashboard Overview Metrics
exports.getOverview = async (req, res) => {
    try {
        const totalRenters = await User.countDocuments({ role: 'renter' });
        const totalOwners = await User.countDocuments({ role: 'owner' });
        const totalProperties = await Property.countDocuments();
        
        // Count bookings that haven't expired yet
        const activeBookings = await Booking.countDocuments({ checkOutDate: { $gte: new Date() } });

        res.json({
            renters: totalRenters,
            owners: totalOwners,
            properties: totalProperties,
            activeBookings
        });
    } catch (error) {
        console.error("Error fetching overview:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get All Users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password');
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Delete a User
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ error: "User not found." });

        if (user.role === 'owner') {
             // Cascade delete properties if an owner is banned
             await Property.deleteMany({ ownerId: id });
        }
        await User.findByIdAndDelete(id);

        res.json({ message: "User deleted successfully." });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get All Properties
exports.getAllProperties = async (req, res) => {
    try {
        const properties = await Property.find().populate('ownerId', 'username email');
        res.json(properties);
    } catch (error) {
        console.error("Error fetching properties:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Delete a Property
exports.deleteProperty = async (req, res) => {
    try {
        const { id } = req.params;
        await Property.findByIdAndDelete(id);
        res.json({ message: "Property deleted successfully." });
    } catch (error) {
        console.error("Error deleting property:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get Bookings Overview
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('renterId', 'username email')
            .populate({
                path: 'propertyId',
                select: 'title location pricePerNight ownerId',
                populate: { path: 'ownerId', select: 'username email' }
            });
        res.json(bookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Detailed User Activity (Drill-down)
exports.getUserActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password');
        if (!user) return res.status(404).json({ error: "User not found." });

        let activity = {};
        if (user.role === 'owner') {
            const properties = await Property.find({ ownerId: id });
            const propIds = properties.map(p => p._id);
            const bookings = await Booking.find({ propertyId: { $in: propIds }, paymentStatus: 'paid' })
                                        .populate('propertyId', 'title');
            
            activity = {
                properties,
                bookings,
                totalLifetimeRevenue: bookings.reduce((acc, curr) => acc + curr.totalAmount, 0)
            };
        } else {
            const bookings = await Booking.find({ renterId: id, paymentStatus: 'paid' })
                                        .populate('propertyId', 'title location imageUrl');
            
            activity = {
                bookings,
                totalLifetimeSpend: bookings.reduce((acc, curr) => acc + curr.totalAmount, 0)
            };
        }

        res.json({ user, activity });
    } catch (error) {
        console.error("Error fetching user activity:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Admin Edit User
exports.updateUserByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, firstName, lastName, phone } = req.body;

        const updatedUser = await User.findByIdAndUpdate(id, {
            username, email, firstName, lastName, phone
        }, { new: true }).select('-password');

        res.json(updatedUser);
    } catch (error) {
        console.error("Error updating user by admin:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Detailed Property Activity (Drill-down)
exports.getPropertyActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const property = await Property.findById(id).populate('ownerId', 'username email');
        if (!property) return res.status(404).json({ error: "Property not found." });

        const bookings = await Booking.find({ propertyId: id, paymentStatus: 'paid' })
                                    .populate('renterId', 'username email');
        
        const activity = {
            bookings,
            totalRevenue: bookings.reduce((acc, curr) => acc + curr.totalAmount, 0),
            totalStays: bookings.length
        };

        res.json({ property, activity });
    } catch (error) {
        console.error("Error fetching property activity:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
