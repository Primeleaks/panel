import jwt from 'jsonwebtoken';

class AnalyticsController {
    constructor(services) {
        this.analyticsService = services.analyticsService;
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

    requireAdmin(req, res, next) {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: "Admin access required" });
        }
        next();
    }

    registerRoutes(app) {
        // Analytics endpoint for admin dashboard
        app.get("/api/admin/analytics", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const timeRange = req.query.timeRange || '30';
                
                const stats = await this.analyticsService.getDashboardStats(timeRange);
                const topScripts = await this.analyticsService.getTopScripts(10);
                const topUsers = await this.analyticsService.getTopUsers(10);
                
                res.json({
                    stats,
                    topScripts,
                    topUsers
                });
            } catch (error) {
                console.error("Error fetching analytics:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
        
        // Dashboard Statistics (Admin only)
        app.get("/api/admin/analytics/dashboard", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const stats = await this.analyticsService.getDashboardStats();
                res.json(stats);
            } catch (error) {
                console.error("Error fetching dashboard statistics:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // User Analytics
        app.get("/api/admin/analytics/users/growth", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const days = parseInt(req.query.days) || 30;
                const growth = await this.analyticsService.getUserGrowth(days);
                res.json(growth);
            } catch (error) {
                console.error("Error fetching user growth:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        app.get("/api/admin/analytics/users/active", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const days = parseInt(req.query.days) || 7;
                const activeUsers = await this.analyticsService.getActiveUsers(days);
                res.json({ activeUsers, days });
            } catch (error) {
                console.error("Error fetching active users:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        app.get("/api/admin/analytics/users/top", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const limit = parseInt(req.query.limit) || 10;
                const sortBy = req.query.sort || 'scripts';
                const topUsers = await this.analyticsService.getTopUsers(limit, sortBy);
                res.json(topUsers);
            } catch (error) {
                console.error("Error fetching top users:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Script Analytics
        app.get("/api/admin/analytics/scripts/trends", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const days = parseInt(req.query.days) || 30;
                const trends = await this.analyticsService.getScriptUploadTrends(days);
                res.json(trends);
            } catch (error) {
                console.error("Error fetching script trends:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        app.get("/api/admin/analytics/scripts/top", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const limit = parseInt(req.query.limit) || 10;
                const sortBy = req.query.sort || 'downloads';
                const topScripts = await this.analyticsService.getTopScripts(limit, sortBy);
                res.json(topScripts);
            } catch (error) {
                console.error("Error fetching top scripts:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        app.get("/api/admin/analytics/scripts/categories", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const categoryStats = await this.analyticsService.getCategoryStats();
                res.json(categoryStats);
            } catch (error) {
                console.error("Error fetching category statistics:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Engagement Analytics
        app.get("/api/admin/analytics/engagement", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const engagement = await this.analyticsService.getEngagementStats();
                res.json(engagement);
            } catch (error) {
                console.error("Error fetching engagement statistics:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        app.get("/api/admin/analytics/comments/trends", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const days = parseInt(req.query.days) || 30;
                const trends = await this.analyticsService.getCommentTrends(days);
                res.json(trends);
            } catch (error) {
                console.error("Error fetching comment trends:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // System Health
        app.get("/api/admin/analytics/system/health", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const health = await this.analyticsService.getSystemHealth();
                res.json(health);
            } catch (error) {
                console.error("Error fetching system health:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Real-time Stats
        app.get("/api/admin/analytics/realtime", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const realTimeStats = await this.analyticsService.getRealTimeStats();
                res.json(realTimeStats);
            } catch (error) {
                console.error("Error fetching real-time stats:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Download Statistics
        app.get("/api/admin/analytics/downloads", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const days = parseInt(req.query.days) || 30;
                const downloadStats = await this.analyticsService.getDownloadStats(days);
                res.json(downloadStats);
            } catch (error) {
                console.error("Error fetching download statistics:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Public Statistics (Limited)
        app.get("/api/stats/public", async (req, res) => {
            try {
                const scriptStats = await this.analyticsService.getScriptStats();
                const engagement = await this.analyticsService.getEngagementStats();
                
                // Only return public-safe stats
                const publicStats = {
                    total_scripts: scriptStats.active_scripts,
                    total_downloads: scriptStats.total_downloads,
                    total_views: scriptStats.total_views,
                    average_rating: parseFloat(scriptStats.average_rating || 0).toFixed(2),
                    total_comments: engagement.total_comments,
                    total_ratings: engagement.total_ratings
                };
                
                res.json(publicStats);
            } catch (error) {
                console.error("Error fetching public statistics:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
}

export default AnalyticsController;
