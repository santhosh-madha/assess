// server/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const propertyRoutes = require('./server/routers/propertyRoutes');
const authRoutes = require('./server/routers/authRoutes');
const bookingRoutes = require('./server/routers/bookingRoutes');
const userRoutes = require('./server/routers/userRoutes');
const adminRoutes = require('./server/routers/adminRoutes');
const chatRoutes = require('./server/routers/chatRoutes');
const chatController = require('./server/controllers/chat');

const connectDB = require('./server/config/db');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);


const corsOptions = {
    origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
};

// Middleware
app.use(express.json());

//use cors
app.use(cors(corsOptions))

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// Routes
const uploadRoutes = require('./server/routers/uploadRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 5000;
const io = socketIO(server, {
    cors: {
        origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'],
        methods: ['GET', 'POST'],
    },
});


io.on('connection', (socket) => {
    console.log('New socket connection');
  
    // Join a private room for each user based on their ID
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their private room.`);
    });

    // Listen for private messages and emit specifically to the receiver
    socket.on('sendMessage', async ({ senderId, receiverId, message }) => {
        try {
            // Save to database with booking validation
            const savedChat = await chatController.saveMessage(senderId, receiverId, message);
            
            // Emit to receiver's private room
            io.to(receiverId).emit('message', savedChat);
            // Optionally emit back to sender to confirm delivery
            socket.emit('messageSent', savedChat);
        } catch (error) {
            console.error("Socket Error (sendMessage):", error.message);
            socket.emit('error', { message: error.message });
        }
    });

    socket.on('markRead', ({ userId }) => {
        // Broadcast back to the user's own room (useful for other tabs)
        io.to(userId).emit('messagesRead');
    });
  
    // Disconnect event
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
});
  
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));