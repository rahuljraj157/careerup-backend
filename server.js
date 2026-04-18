// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// dotenv.config();

// import http from 'http';
// import morgan from 'morgan';
// import nocache from 'nocache';

// import authRoutes from './routes/auth/authRoutes.js'; 
// import userRoutes from './routes/user/user.js'; 
// import userDataRoutes from './routes/user/userData.js';
// import chatRoutes from './routes/user/chatRoutes.js';
// import adminRoutes from './routes/admin/admin.js';

// import { errorHandler } from './middlewares/errorHandler.js';
// import { connectDB } from './connection/databse.js';
// import { Server as SocketIoServer } from 'socket.io';

// const app = express(); 
// const server = http.createServer(app);  

// // ✅ Socket.io setup (allow both ports)
// const io = new SocketIoServer(server, {
//     pingTimeout: 60000,
//     cors: {
//         origin: ["http://localhost:5173", "http://localhost:5174"],
//         methods: ["GET", "POST"],
//         credentials: true
//     }
// });

// // ✅ Middleware
// app.use(cors({
//     origin: ["http://localhost:5173", "http://localhost:5174"],
//     credentials: true
// }));

// app.use(nocache());
// app.use(morgan('dev'));

// app.use(express.json()); 
// app.use(express.urlencoded({ extended: true }));

// // ✅ Routes

// // Auth (unchanged)
// app.use('/api/auth', authRoutes);

// // 🔥 FIX: mount userRoutes on BOTH paths
// app.use('/api/user', userRoutes);   // new structured
// app.use('/api', userRoutes);        // old compatibility (IMPORTANT)

// // Other routes (unchanged)
// app.use('/api/user-data', userDataRoutes);
// app.use('/api/chat', chatRoutes);
// app.use('/api/admin', adminRoutes);

// // ✅ Error handler
// app.use(errorHandler); 

// // ✅ DB connection
// connectDB();

// // ✅ Socket events
// io.on('connection', (socket) => {

//     socket.on('start', (userData) => { 
//         socket.join(userData);
//         console.log(userData, 'user joined');
//     });

//     socket.on('join chat', (chatRoom) => {
//         socket.join(chatRoom);
//         console.log('joined room: ' + chatRoom);
//     });

//     socket.on('new chat message', (message) => {
//         const chat = message.chat;

//         if (!chat.participants) return;

//         chat.participants.forEach((user) => {
//             if (user._id === message.sender._id) return;

//             socket.in(user._id).emit('message recieved', message);
//         });
//     });

//     socket.on('disconnect', () => {});
// });

// // ✅ Health check
// app.get('/', (req, res) => {
//     res.send('API is running...');
// });

// // ✅ Start server
// const port = process.env.PORT || 3000;
// server.listen(port, () => {
//     console.log(`🚀 server running on http://localhost:${port}`);
// });
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import morgan from 'morgan';
import nocache from 'nocache';

import authRoutes from './routes/auth/authRoutes.js'; 
import userRoutes from './routes/user/user.js'; 
import userDataRoutes from './routes/user/userData.js';
import chatRoutes from './routes/user/chatRoutes.js';
import adminRoutes from './routes/admin/admin.js';

import { errorHandler } from './middlewares/errorHandler.js';
import { connectDB } from './connection/databse.js';
import { Server as SocketIoServer } from 'socket.io';

const app = express(); 
const server = http.createServer(app);  

// ✅ Socket.io setup
const io = new SocketIoServer(server, {
    pingTimeout: 60000,
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// ✅ Middleware
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true
}));

app.use(nocache());
app.use(morgan('dev'));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// ===================== ROUTES ===================== //

// ✅ Auth (no change)
app.use('/api/auth', authRoutes);

// ✅ User routes
app.use('/api/user', userRoutes);
app.use('/api', userRoutes); // 🔥 compatibility

// ✅ User data routes
app.use('/api/user-data', userDataRoutes);
app.use('/api', userDataRoutes); // 🔥 compatibility

// ✅ Chat routes
app.use('/api/chat', chatRoutes);
app.use('/api', chatRoutes); // 🔥 compatibility

// ✅ Admin routes (no compatibility needed usually)
app.use('/api/admin', adminRoutes);

// ===================== ERROR HANDLER ===================== //
app.use(errorHandler); 

// ===================== DB ===================== //
connectDB();

// ===================== SOCKET ===================== //
io.on('connection', (socket) => {

    socket.on('start', (userData) => { 
        socket.join(userData);
        console.log(userData, 'user joined');
    });

    socket.on('join chat', (chatRoom) => {
        socket.join(chatRoom);
        console.log('joined room: ' + chatRoom);
    });

    socket.on('new chat message', (message) => {
        const chat = message.chat;

        if (!chat.participants) return;

        chat.participants.forEach((user) => {
            if (user._id === message.sender._id) return;
            socket.in(user._id).emit('message recieved', message);
        });
    });

    socket.on('disconnect', () => {});
});

// ===================== HEALTH ===================== //
app.get('/', (req, res) => {
    res.send('API is running...');
});

// ===================== SERVER ===================== //
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`🚀 server running on http://localhost:${port}`);
});