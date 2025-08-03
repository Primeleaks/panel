import jwt from 'jsonwebtoken';

class ModerationController {
    constructor(services, io) {
        this.moderationService = services.moderationService;
        this.scriptService = services.scriptService;
        this.commentService = services.commentService;
        this.notificationService = services.notificationService;
        this.io = io;
    }
    
    // Helper method to send real-time notifications
    async sendRealtimeNotification(userId, type, title, message, data = {}) {
        try {
            // Create notification in database
            const notificationId = await this.notificationService.createNotification(
                userId,
                type,
                title,
                message,
                data
            );
            
            // Send real-time notification through WebSocket
            if (this.io) {
                const notification = {
                    id: notificationId,
                    type,
                    title,
                    message,
                    data,
                    created_at: new Date().toISOString(),
                    is_read: 0
                };
                
                this.io.to(`user_${userId}`).emit('notification', notification);
            }
            
            return notificationId;
        } catch (error) {
            console.error('Failed to send notification:', error);
            return null;
        }
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
        // Reports
        app.post("/api/reports", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const reporterId = req.user.discord_id;
                const { type, targetId, reason, description } = req.body;

                if (!type || !targetId || !reason) {
                    return res.status(400).json({ message: "Missing required fields" });
                }

                const validTypes = ['script', 'comment', 'user'];
                if (!validTypes.includes(type)) {
                    return res.status(400).json({ message: "Invalid report type" });
                }

                const reportId = await this.moderationService.createReport(
                    reporterId, 
                    type, 
                    targetId, 
                    reason, 
                    description
                );
                
                res.json({ 
                    message: "Report submitted successfully",
                    reportId 
                });
            } catch (error) {
                console.error("Error creating report:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        app.get("/api/admin/reports", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const status = req.query.status;
                const limit = parseInt(req.query.limit) || 50;
                const offset = parseInt(req.query.offset) || 0;

                const reports = await this.moderationService.getReports(status, limit, offset);
                res.json(reports);
            } catch (error) {
                console.error("Error fetching reports:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
        
        // Admin moderation endpoints with specific routing
        app.get("/api/admin/moderation/reports", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const reports = await this.moderationService.getPendingReports();
                res.json(reports);
            } catch (error) {
                console.error('Error fetching reports:', error);
                res.status(500).json({ message: "Failed to fetch reports" });
            }
        });

        app.get("/api/admin/moderation/pending-scripts", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const scripts = await this.moderationService.getPendingScripts();
                res.json(scripts);
            } catch (error) {
                console.error('Error fetching pending scripts:', error);
                res.status(500).json({ message: "Failed to fetch pending scripts" });
            }
        });

        app.get("/api/admin/moderation/user-strikes", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const strikes = await this.moderationService.getUserStrikes();
                res.json(strikes);
            } catch (error) {
                console.error('Error fetching user strikes:', error);
                res.status(500).json({ message: "Failed to fetch user strikes" });
            }
        });

        app.post("/api/admin/moderation/reports/:reportId/resolve", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const { reportId } = req.params;
                const { action } = req.body;
                
                await this.moderationService.resolveReport(reportId, action, req.user.discord_id);
                res.json({ success: true, message: "Report resolved successfully" });
            } catch (error) {
                console.error('Error resolving report:', error);
                res.status(500).json({ message: "Failed to resolve report" });
            }
        });

        // Get all user strikes (admin only)
        app.get("/api/admin/moderation/strikes", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const strikes = await this.moderationService.getAllUserStrikes();
                res.json(strikes);
            } catch (error) {
                console.error("Error fetching user strikes:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
        
        // Get strikes for a specific user (admin or self)
        app.get("/api/users/:userId/strikes", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const targetUserId = req.params.userId;
                const requestingUserId = req.user.discord_id;
                
                // Only allow admins or the user themselves to see strikes
                if (targetUserId !== requestingUserId && !req.user.isAdmin) {
                    return res.status(403).json({ message: "Access denied" });
                }
                
                const activeOnly = req.query.activeOnly === 'true';
                const strikes = await this.moderationService.getUserStrikes(targetUserId, activeOnly);
                res.json(strikes);
            } catch (error) {
                console.error("Error fetching user strikes:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
        
        // Add a strike to a user (admin only)
        app.post("/api/admin/users/:userId/strikes", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const targetUserId = req.params.userId;
                const adminId = req.user.discord_id;
                const { reason, expiresInDays } = req.body;
                
                if (!reason) {
                    return res.status(400).json({ message: "Reason is required" });
                }
                
                const strikeId = await this.moderationService.giveUserStrike(
                    targetUserId,
                    reason,
                    adminId,
                    expiresInDays || 30
                );
                
                // Send notification to user
                await this.sendRealtimeNotification(
                    targetUserId,
                    'user_strike',
                    'Account Warning',
                    `You have received a strike from a moderator.`,
                    {
                        reason,
                        strikeId,
                        expiresInDays
                    }
                );
                
                res.json({
                    message: "Strike added successfully",
                    strikeId
                });
            } catch (error) {
                console.error("Error adding strike:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
        
        // Remove a strike (admin only)
        app.delete("/api/admin/strikes/:strikeId", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const strikeId = req.params.strikeId;
                const adminId = req.user.discord_id;
                
                const strike = await this.moderationService.getStrikeById(strikeId);
                if (!strike) {
                    return res.status(404).json({ message: "Strike not found" });
                }
                
                await this.moderationService.removeStrike(strikeId, adminId);
                
                // Notify the user
                await this.sendRealtimeNotification(
                    strike.user_id,
                    'strike_removed',
                    'Strike Removed',
                    `A strike has been removed from your account.`,
                    {
                        strikeId,
                        originalReason: strike.reason
                    }
                );
                
                res.json({ message: "Strike removed successfully" });
            } catch (error) {
                console.error("Error removing strike:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
        
        // Resolve a report (admin only)
        app.post("/api/reports/:reportId/resolve", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const reportId = parseInt(req.params.reportId);
                const { action } = req.body;
                
                if (!reportId) {
                    return res.status(400).json({ message: "Invalid report ID" });
                }
                
                const report = await this.moderationService.getReportById(reportId);
                if (!report) {
                    return res.status(404).json({ message: "Report not found" });
                }
                
                // Take action based on report type and requested action
                const adminId = req.user.discord_id;
                const adminUsername = req.user.username;
                
                if (action === 'action') {
                    // Take appropriate action based on report type
                    if (report.type === 'script') {
                        // Remove the script
                        await this.scriptService.markAsDeleted(report.target_id);
                        
                        // Notify the author
                        const script = await this.scriptService.getScriptById(report.target_id);
                        if (script) {
                            await this.sendRealtimeNotification(
                                script.authorId,
                                'script_moderation',
                                'Script Removed',
                                `Your script "${script.title}" has been removed due to a violation report.`,
                                {
                                    scriptId: script.id,
                                    scriptTitle: script.title,
                                    reason: report.reason
                                }
                            );
                        }
                    } else if (report.type === 'comment') {
                        // Delete the comment
                        const comment = await this.commentService.getComment(report.target_id);
                        if (comment) {
                            await this.commentService.deleteComment(comment.id, comment.user_id, true);
                            
                            // Notify the comment author
                            await this.sendRealtimeNotification(
                                comment.user_id,
                                'comment_moderation',
                                'Comment Removed',
                                `Your comment has been removed due to a violation report.`,
                                {
                                    scriptId: comment.script_id,
                                    commentId: comment.id,
                                    reason: report.reason
                                }
                            );
                        }
                    } else if (report.type === 'user') {
                        // Add a strike to the user
                        await this.moderationService.addUserStrike(
                            report.target_id,
                            adminId,
                            `Received report: ${report.reason}`
                        );
                        
                        // Notify the user about the strike
                        await this.sendRealtimeNotification(
                            report.target_id,
                            'user_strike',
                            'Account Warning',
                            `You have received a strike for violating community guidelines.`,
                            {
                                reason: report.reason,
                                reportId: report.id
                            }
                        );
                    }
                }
                
                // Update report status
                const status = action === 'dismiss' ? 'dismissed' : 'resolved';
                await this.moderationService.updateReportStatus(reportId, status, adminId);
                
                // Notify the reporter
                await this.sendRealtimeNotification(
                    report.reporter_id,
                    'report_update',
                    'Report Update',
                    `Your report has been ${status}.`,
                    {
                        reportId: report.id,
                        reportType: report.type,
                        targetId: report.target_id,
                        status
                    }
                );
                
                res.json({
                    message: `Report ${status} successfully`,
                    reportId
                });
            } catch (error) {
                console.error("Error resolving report:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        app.put("/api/admin/reports/:reportId", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const { reportId } = req.params;
                const { status, action } = req.body;
                const reviewerId = req.user.discord_id;

                const validStatuses = ['reviewed', 'resolved', 'dismissed'];
                if (!validStatuses.includes(status)) {
                    return res.status(400).json({ message: "Invalid status" });
                }

                const success = await this.moderationService.updateReportStatus(
                    reportId, 
                    reviewerId, 
                    status, 
                    action
                );
                
                if (success) {
                    // Log the action
                    await this.moderationService.logAuditAction(
                        reviewerId,
                        'report_review',
                        'report',
                        reportId,
                        { status, action },
                        req.ip
                    );
                    
                    res.json({ message: "Report updated successfully" });
                } else {
                    res.status(404).json({ message: "Report not found" });
                }
            } catch (error) {
                console.error("Error updating report:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // User Strikes
        app.post("/api/admin/users/:userId/strike", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const { userId } = req.params;
                const { reason, expiresInDays } = req.body;
                const givenBy = req.user.discord_id;

                if (!reason) {
                    return res.status(400).json({ message: "Strike reason is required" });
                }

                const strikeId = await this.moderationService.giveUserStrike(
                    userId, 
                    reason, 
                    givenBy, 
                    expiresInDays
                );
                
                // Log the action
                await this.moderationService.logAuditAction(
                    givenBy,
                    'give_strike',
                    'user',
                    userId,
                    { reason, expires_in_days: expiresInDays },
                    req.ip
                );
                
                res.json({ 
                    message: "Strike issued successfully",
                    strikeId 
                });
            } catch (error) {
                console.error("Error issuing strike:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        app.get("/api/admin/users/:userId/strikes", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const { userId } = req.params;
                const activeOnly = req.query.active !== 'false';

                const strikes = await this.moderationService.getUserStrikes(userId, activeOnly);
                res.json(strikes);
            } catch (error) {
                console.error("Error fetching user strikes:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        app.delete("/api/admin/strikes/:strikeId", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const { strikeId } = req.params;
                const removedBy = req.user.discord_id;

                const success = await this.moderationService.removeUserStrike(strikeId, removedBy);
                
                if (success) {
                    res.json({ message: "Strike removed successfully" });
                } else {
                    res.status(404).json({ message: "Strike not found" });
                }
            } catch (error) {
                console.error("Error removing strike:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Audit Logs
        app.get("/api/admin/audit-logs", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const limit = parseInt(req.query.limit) || 100;
                const offset = parseInt(req.query.offset) || 0;
                const adminId = req.query.admin_id;
                const action = req.query.action;

                const logs = await this.moderationService.getAuditLogs(limit, offset, adminId, action);
                res.json(logs);
            } catch (error) {
                console.error("Error fetching audit logs:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Moderation Statistics
        app.get("/api/admin/moderation/stats", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const stats = await this.moderationService.getModerationStats();
                res.json(stats);
            } catch (error) {
                console.error("Error fetching moderation stats:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Content Actions (for admins)
        app.delete("/api/admin/scripts/:scriptId", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const { scriptId } = req.params;
                const adminId = req.user.discord_id;

                const success = await this.moderationService.deleteScript(scriptId, adminId);
                
                if (success) {
                    res.json({ message: "Script deleted successfully" });
                } else {
                    res.status(404).json({ message: "Script not found" });
                }
            } catch (error) {
                console.error("Error deleting script:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        app.delete("/api/admin/comments/:commentId", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const { commentId } = req.params;
                const adminId = req.user.discord_id;

                const success = await this.moderationService.deleteComment(commentId, adminId);
                
                if (success) {
                    res.json({ message: "Comment deleted successfully" });
                } else {
                    res.status(404).json({ message: "Comment not found" });
                }
            } catch (error) {
                console.error("Error deleting comment:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Cleanup operations (for maintenance)
        app.post("/api/admin/cleanup/strikes", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const cleanedCount = await this.moderationService.cleanupExpiredStrikes();
                
                await this.moderationService.logAuditAction(
                    req.user.discord_id,
                    'cleanup_strikes',
                    null,
                    null,
                    { cleaned_count: cleanedCount },
                    req.ip
                );
                
                res.json({ 
                    message: `Cleaned up ${cleanedCount} expired strikes`,
                    cleanedCount 
                });
            } catch (error) {
                console.error("Error cleaning up strikes:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
}

export default ModerationController;
