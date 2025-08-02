import dotenv from 'dotenv';
import express from 'express';
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

import dbConnection, { checkTables } from "./database.js";
import setupDiscordBot from './discordbot.js';

import UserService from "./services/UserService.js";
import BlacklistService from "./services/BlacklistService.js";
import ScriptService from "./services/ScriptService.js";
import DiscordService from "./services/DiscordService.js";
import UserProfileService from "./services/UserProfileService.js";
import RatingService from "./services/RatingService.js";
import CommentService from "./services/CommentService.js";
import SocialService from "./services/SocialService.js";
import NotificationService from "./services/NotificationService.js";
import ModerationService from "./services/ModerationService.js";
import AnalyticsService from "./services/AnalyticsService.js";
import CollectionService from "./services/CollectionService.js";
import AdvertisingService from "./services/AdvertisingService.js";

import DiscordController from "./controller/DiscordController.js";
import TokenController from "./controller/TokenController.js";
import BlacklistController from "./controller/BlacklistController.js";
import ScriptController from "./controller/ScriptController.js";
import UserProfileController from "./controller/UserProfileController.js";
import RatingController from "./controller/RatingController.js";
import CommentController from "./controller/CommentController.js";
import SocialController from "./controller/SocialController.js";
import NotificationController from "./controller/NotificationController.js";
import ModerationController from "./controller/ModerationController.js";
import AnalyticsController from "./controller/AnalyticsController.js";
import CollectionController from "./controller/CollectionController.js";
import AdvertisingController from "./controller/AdvertisingController.js";
import SiteSettingsController from "./controller/SiteSettingsController.js";

dotenv.config();

const PORT = process.env.SERVER_PORT || 3000;

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3001', 'http://localhost:5173'],
        credentials: true
    }
});

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use('/api/', limiter);

await checkTables();

const services = {
    userService: new UserService(),
    blacklistService: new BlacklistService(),
    scriptService: new ScriptService(),
    discordService: new DiscordService(),
    userProfileService: new UserProfileService(),
    ratingService: new RatingService(),
    commentService: new CommentService(),
    socialService: new SocialService(),
    notificationService: new NotificationService(),
    moderationService: new ModerationService(),
    analyticsService: new AnalyticsService(),
    collectionService: new CollectionService(),
    advertisingService: new AdvertisingService()
};

// WebSocket authentication middleware
const authenticateSocket = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.match(/token=([^;]+)/)?.[1];
        
        if (!token) {
            return next(new Error('Authentication error'));
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        socket.userId = decoded.discord_id;
        socket.userInfo = decoded;
        
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
};

// WebSocket connection handling
io.use(authenticateSocket);

io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);
    
    // Join user to their personal room
    socket.join(`user_${socket.userId}`);
    
    // Handle authentication
    socket.on('auth', async (data) => {
        socket.emit('auth_success', { userId: socket.userId });
    });
    
    // Handle room joining (for script-specific updates)
    socket.on('join_room', (data) => {
        const { room } = data;
        if (room && typeof room === 'string' && room.length < 50) {
            socket.join(room);
            console.log(`User ${socket.userId} joined room: ${room}`);
        }
    });
    
    // Handle room leaving  
    socket.on('leave_room', (data) => {
        const { room } = data;
        if (room && typeof room === 'string') {
            socket.leave(room);
            console.log(`User ${socket.userId} left room: ${room}`);
        }
    });
    
    // Handle typing indicators
    socket.on('typing', (data) => {
        const { script_id, typing } = data;
        if (script_id) {
            socket.to(`script_${script_id}`).emit('typing', {
                userId: socket.userId,
                username: socket.userInfo.username,
                typing
            });
        }
    });
    
    // Handle status updates
    socket.on('status', (data) => {
        const { status } = data;
        socket.userStatus = status;
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
    });
});

// Make io available to controllers
app.set('io', io);

const discordClient = setupDiscordBot(services.scriptService);

const discordController = new DiscordController(services);
const tokenController = new TokenController();
const blacklistController = new BlacklistController(services);
const scriptController = new ScriptController(services, discordClient, io);
const userProfileController = new UserProfileController(services, io);
const ratingController = new RatingController(services, io);
const commentController = new CommentController(services, io);
const socialController = new SocialController(services, io);
const notificationController = new NotificationController(services, io);
const moderationController = new ModerationController(services, io);
const analyticsController = new AnalyticsController(services);
const collectionController = new CollectionController(services);
const advertisingController = new AdvertisingController(services);
const siteSettingsController = new SiteSettingsController(services);

discordController.registerRoutes(app);
tokenController.registerRoutes(app);
blacklistController.registerRoutes(app);
scriptController.registerRoutes(app);
userProfileController.registerRoutes(app);
ratingController.registerRoutes(app);
commentController.registerRoutes(app);
socialController.registerRoutes(app);
notificationController.registerRoutes(app);
moderationController.registerRoutes(app);
analyticsController.registerRoutes(app);
collectionController.registerRoutes(app);
advertisingController.registerRoutes(app);
siteSettingsController.registerRoutes(app);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal server error',
            ...(isDevelopment && { stack: err.stack })
        }
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`WebSocket server enabled`);
});



