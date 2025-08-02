import jwt from 'jsonwebtoken';

class NotificationController {
    constructor(services) {
        this.notificationService = services.notificationService;
    }

    authenticateJWT(req, res, next) {
        const authHeader = req.headers.authorization;
        let token;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(403).json({ message: "Authentication required" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (err) {
            return res.status(403).json({ message: "Invalid or expired token" });
        }
    }

    registerRoutes(app) {
        // Get user notifications
        app.get("/api/notifications", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const userId = req.user.discord_id;
                const limit = parseInt(req.query.limit) || 20;
                const offset = parseInt(req.query.offset) || 0;
                const unreadOnly = req.query.unread === 'true';

                const notifications = await this.notificationService.getUserNotifications(
                    userId, 
                    limit, 
                    offset, 
                    unreadOnly
                );
                
                res.json(notifications);
            } catch (error) {
                console.error("Error fetching notifications:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Get unread notification count
        app.get("/api/notifications/unread/count", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const userId = req.user.discord_id;
                const count = await this.notificationService.getUnreadCount(userId);
                res.json({ count });
            } catch (error) {
                console.error("Error fetching unread count:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Mark notification as read
        app.put("/api/notifications/:notificationId/read", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const userId = req.user.discord_id;
                const { notificationId } = req.params;

                const success = await this.notificationService.markAsRead(notificationId, userId);
                
                if (success) {
                    res.json({ message: "Notification marked as read" });
                } else {
                    res.status(404).json({ message: "Notification not found" });
                }
            } catch (error) {
                console.error("Error marking notification as read:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Mark all notifications as read
        app.put("/api/notifications/read-all", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const userId = req.user.discord_id;
                const count = await this.notificationService.markAllAsRead(userId);
                res.json({ 
                    message: `${count} notifications marked as read`,
                    count 
                });
            } catch (error) {
                console.error("Error marking all notifications as read:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Delete notification
        app.delete("/api/notifications/:notificationId", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const userId = req.user.discord_id;
                const { notificationId } = req.params;

                const success = await this.notificationService.deleteNotification(notificationId, userId);
                
                if (success) {
                    res.json({ message: "Notification deleted" });
                } else {
                    res.status(404).json({ message: "Notification not found" });
                }
            } catch (error) {
                console.error("Error deleting notification:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Create manual notification (admin only)
        app.post("/api/notifications", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                if (!req.user.isAdmin) {
                    return res.status(403).json({ message: "Admin access required" });
                }

                const { userId, type, title, message, data } = req.body;

                if (!userId || !type || !title || !message) {
                    return res.status(400).json({ message: "Missing required fields" });
                }

                const notificationId = await this.notificationService.createNotification(
                    userId, 
                    type, 
                    title, 
                    message, 
                    data
                );
                
                res.json({ 
                    message: "Notification created",
                    notificationId 
                });
            } catch (error) {
                console.error("Error creating notification:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
}

export default NotificationController;
