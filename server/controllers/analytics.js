const Booking = require('../models/Booking');
const Property = require('../models/Property');
const User = require('../models/User');

// --- Helper: Get Last N Months Array ---
const getMonthsRange = (months) => {
    const dates = [];
    for (let i = months - 1; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        dates.push({
            month: d.toLocaleString('default', { month: 'short' }),
            year: d.getFullYear(),
            key: `${d.getMonth()}-${d.getFullYear()}`
        });
    }
    return dates;
};

exports.getAdminAnalytics = async (req, res) => {
    try {
        const { range } = req.query; // '6' or '12'
        const monthsCount = parseInt(range) || 6;
        const monthsRange = getMonthsRange(monthsCount);

        // 1. Revenue & Booking Trends
        const bookings = await Booking.find({ paymentStatus: 'paid' });
        const trendData = monthsRange.map(m => {
            const matches = bookings.filter(b => {
                const bDate = new Date(b.createdAt);
                return bDate.getMonth() === monthsRange.find(mon => mon.key === m.key).key.split('-')[0] * 1 && 
                       bDate.getFullYear() === m.year;
            });
            return {
                name: m.month,
                revenue: matches.reduce((acc, curr) => acc + curr.totalAmount, 0),
                bookings: matches.length
            };
        });

        // 2. Property Distribution
        const properties = await Property.find();
        const propertyTypes = {};
        properties.forEach(p => {
            propertyTypes[p.propertyType] = (propertyTypes[p.propertyType] || 0) + 1;
        });
        const distData = Object.keys(propertyTypes).map(type => ({
            name: type.charAt(0).toUpperCase() + type.slice(1),
            value: propertyTypes[type]
        }));

        res.json({ trendData, distData });
    } catch (error) {
        console.error("Admin Analytics Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.getOwnerAnalytics = async (req, res) => {
    try {
        const { range } = req.query; 
        const monthsCount = parseInt(range) || 6;
        const monthsRange = getMonthsRange(monthsCount);
        const ownerId = req.user.userId;

        // 1. Fetch Owner's Properties
        const myProperties = await Property.find({ ownerId });
        const propIds = myProperties.map(p => p._id);

        // 2. Fetch Bookings for those properties
        const bookings = await Booking.find({ propertyId: { $in: propIds }, paymentStatus: 'paid' });

        // 3. Revenue Trend
        const earningsTrend = monthsRange.map(m => {
            const matches = bookings.filter(b => {
                const bDate = new Date(b.createdAt);
                const [monthKey, yearKey] = m.key.split('-');
                return bDate.getMonth() === parseInt(monthKey) && bDate.getFullYear() === parseInt(yearKey);
            });
            return {
                name: m.month,
                earnings: matches.reduce((acc, curr) => acc + curr.totalAmount, 0)
            };
        });

        // 4. Performance per Property
        const performanceData = myProperties.map(p => {
            const pBookings = bookings.filter(b => b.propertyId.toString() === p._id.toString());
            return {
                name: p.title.length > 15 ? p.title.substring(0, 12) + '...' : p.title,
                value: pBookings.reduce((acc, curr) => acc + curr.totalAmount, 0)
            };
        }).filter(p => p.value > 0);

        res.json({ earningsTrend, performanceData });
    } catch (error) {
        console.error("Owner Analytics Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
