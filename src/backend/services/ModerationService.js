import dbConnection from "../database.js";

class ModerationService {
    // Reports Management
    async createReport(reporterId, type, targetId, reason, description = null) {
        const query = `
            INSERT INTO reports (reporter_id, type, target_id, reason, description)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await dbConnection.query(query, [reporterId, type, targetId, reason, description]);
        return result.insertId;
    }

    async getReports(status = null, limit = 50, offset = 0) {
        const statusClause = status ? "WHERE r.status = ?" : "";
        const params = status ? [status, limit, offset] : [limit, offset];
        
        const query = `
            SELECT r.*, 
                   reporter.username as reporter_name,
                   reviewer.username as reviewer_name
            FROM reports r
            JOIN users reporter ON r.reporter_id = reporter.discord_id
            LEFT JOIN users reviewer ON r.reviewed_by = reviewer.discord_id
            ${statusClause}
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await dbConnection.query(query, params);
        return rows;
    }

    async updateReportStatus(reportId, reviewerId, status, action = null) {
        const query = `
            UPDATE reports 
            SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        const [result] = await dbConnection.query(query, [status, reviewerId, reportId]);
        
        if (result.affectedRows > 0 && action) {
            await this.executeReportAction(reportId, action, reviewerId);
        }
        
        return result.affectedRows > 0;
    }

    async executeReportAction(reportId, action, adminId) {
        const report = await this.getReport(reportId);
        if (!report) return;

        switch (action) {
            case 'delete_content':
                if (report.type === 'script') {
                    await this.deleteScript(report.target_id, adminId);
                } else if (report.type === 'comment') {
                    await this.deleteComment(report.target_id, adminId);
                }
                break;
            case 'strike_user':
                await this.giveUserStrike(report.target_id, 'Content violation', adminId);
                break;
            case 'ban_user':
                // This would integrate with your existing blacklist system
                break;
        }
    }

    async getReport(reportId) {
        const query = "SELECT * FROM reports WHERE id = ?";
        const [rows] = await dbConnection.query(query, [reportId]);
        return rows[0] || null;
    }

    // User Strikes System
    async giveUserStrike(userId, reason, givenBy, expiresInDays = 30) {
        const expiresAt = expiresInDays ? 
            new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : 
            null;
        
        const query = `
            INSERT INTO user_strikes (user_id, reason, given_by, expires_at)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await dbConnection.query(query, [userId, reason, givenBy, expiresAt]);
        return result.insertId;
    }

    async getUserStrikes(userId, activeOnly = true) {
        const activeClause = activeOnly ? "AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW())" : "";
        const query = `
            SELECT s.*, admin.username as admin_name
            FROM user_strikes s
            JOIN users admin ON s.given_by = admin.discord_id
            WHERE s.user_id = ? ${activeClause}
            ORDER BY s.created_at DESC
        `;
        const [rows] = await dbConnection.query(query, [userId]);
        return rows;
    }

    async getPendingReports() {
        const query = `
            SELECT r.*, 
                   reporter.username as reporter_name,
                   CASE 
                       WHEN r.type = 'script' THEN s.title
                       WHEN r.type = 'comment' THEN SUBSTRING(c.comment, 1, 50)
                       WHEN r.type = 'user' THEN u.username
                   END as target_name
            FROM reports r
            JOIN users reporter ON r.reporter_id = reporter.discord_id
            LEFT JOIN scripts s ON r.type = 'script' AND r.target_id = s.id
            LEFT JOIN comments c ON r.type = 'comment' AND r.target_id = c.id
            LEFT JOIN users u ON r.type = 'user' AND r.target_id = u.discord_id
            WHERE r.status = 'pending'
            ORDER BY r.created_at DESC
        `;
        const [rows] = await dbConnection.query(query);
        return rows;
    }

    async getPendingScripts() {
        const query = `
            SELECT s.*, u.username as author
            FROM scripts s
            JOIN users u ON s.authorId = u.discord_id
            WHERE s.isPending = 1 AND s.isDeleted = 0
            ORDER BY s.date DESC
        `;
        const [rows] = await dbConnection.query(query);
        return rows;
    }

    async getAllUserStrikes() {
        const query = `
            SELECT 
                us.user_id,
                u.username,
                COUNT(*) as strike_count,
                MAX(us.created_at) as last_strike_date,
                (SELECT reason FROM user_strikes WHERE user_id = us.user_id ORDER BY created_at DESC LIMIT 1) as last_strike_reason
            FROM user_strikes us
            JOIN users u ON us.user_id = u.discord_id
            WHERE us.is_active = 1 AND (us.expires_at IS NULL OR us.expires_at > NOW())
            GROUP BY us.user_id, u.username
            ORDER BY strike_count DESC, last_strike_date DESC
        `;
        const [rows] = await dbConnection.query(query);
        return rows;
    }

    async resolveReport(reportId, action, adminId) {
        const status = action === 'dismiss' ? 'resolved' : 'resolved';
        
        const query = `
            UPDATE reports 
            SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        const [result] = await dbConnection.query(query, [status, adminId, reportId]);
        
        if (result.affectedRows > 0 && action !== 'dismiss') {
            await this.executeReportAction(reportId, action, adminId);
        }
        
        return result.affectedRows > 0;
    }
    
    async getAllUserStrikes() {
        // Get summarized strike data for all users
        const query = `
            SELECT 
                u.discord_id as user_id,
                u.username,
                u.avatar,
                COUNT(s.id) as strike_count,
                MAX(s.created_at) as last_strike_date,
                (SELECT reason FROM user_strikes 
                 WHERE user_id = u.discord_id 
                 ORDER BY created_at DESC LIMIT 1) as last_strike_reason
            FROM users u
            JOIN user_strikes s ON u.discord_id = s.user_id
            WHERE s.is_active = 1 AND (s.expires_at IS NULL OR s.expires_at > NOW())
            GROUP BY u.discord_id, u.username, u.avatar
            ORDER BY strike_count DESC, last_strike_date DESC
        `;
        const [rows] = await dbConnection.query(query);
        return rows;
    }
    
    async getStrikeById(strikeId) {
        const query = `
            SELECT s.*, u.username as user_name, admin.username as admin_name
            FROM user_strikes s
            JOIN users u ON s.user_id = u.discord_id
            JOIN users admin ON s.given_by = admin.discord_id
            WHERE s.id = ?
        `;
        const [rows] = await dbConnection.query(query, [strikeId]);
        return rows[0] || null;
    }
    
    async removeStrike(strikeId, adminId) {
        const query = `
            UPDATE user_strikes
            SET is_active = 0, removed_by = ?, removed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        const [result] = await dbConnection.query(query, [adminId, strikeId]);
        return result.affectedRows > 0;
    }

    async removeUserStrike(strikeId, removedBy) {
        const query = "UPDATE user_strikes SET is_active = 0 WHERE id = ?";
        const [result] = await dbConnection.query(query, [strikeId]);
        
        if (result.affectedRows > 0) {
            // Log the removal
            await this.logAuditAction(removedBy, 'remove_strike', 'strike', strikeId, { strike_id: strikeId });
        }
        
        return result.affectedRows > 0;
    }

    // Content Moderation
    async deleteScript(scriptId, adminId) {
        const query = `
            UPDATE scripts 
            SET isDeleted = 1, deletedAt = CURRENT_TIMESTAMP, deletedBy = ?
            WHERE id = ?
        `;
        const [result] = await dbConnection.query(query, [adminId, scriptId]);
        
        if (result.affectedRows > 0) {
            await this.logAuditAction(adminId, 'delete_script', 'script', scriptId, { script_id: scriptId });
        }
        
        return result.affectedRows > 0;
    }

    async deleteComment(commentId, adminId) {
        const query = "UPDATE comments SET is_deleted = 1 WHERE id = ?";
        const [result] = await dbConnection.query(query, [commentId]);
        
        if (result.affectedRows > 0) {
            await this.logAuditAction(adminId, 'delete_comment', 'comment', commentId, { comment_id: commentId });
        }
        
        return result.affectedRows > 0;
    }

    // Content Filtering (basic implementation)
    isContentAppropriate(content) {
        const inappropriateWords = [
            // Add your inappropriate words list here
            'spam', 'scam', 'hack', 'cheat'
        ];
        
        const lowerContent = content.toLowerCase();
        return !inappropriateWords.some(word => lowerContent.includes(word));
    }

    // Audit Logging
    async logAuditAction(adminId, action, targetType = null, targetId = null, details = null, ipAddress = null) {
        const query = `
            INSERT INTO audit_logs (admin_id, action, target_type, target_id, details, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const detailsJson = details ? JSON.stringify(details) : null;
        const [result] = await dbConnection.query(query, [adminId, action, targetType, targetId, detailsJson, ipAddress]);
        return result.insertId;
    }

    async getAuditLogs(limit = 100, offset = 0, adminId = null, action = null) {
        let whereClause = "";
        const params = [];
        
        if (adminId || action) {
            const conditions = [];
            if (adminId) {
                conditions.push("a.admin_id = ?");
                params.push(adminId);
            }
            if (action) {
                conditions.push("a.action = ?");
                params.push(action);
            }
            whereClause = `WHERE ${conditions.join(" AND ")}`;
        }
        
        params.push(limit, offset);
        
        const query = `
            SELECT a.*, u.username as admin_name
            FROM audit_logs a
            JOIN users u ON a.admin_id = u.discord_id
            ${whereClause}
            ORDER BY a.created_at DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await dbConnection.query(query, params);
        
        return rows.map(log => ({
            ...log,
            details: log.details ? JSON.parse(log.details) : null
        }));
    }

    // Analytics for admin dashboard
    async getModerationStats() {
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports,
                (SELECT COUNT(*) FROM reports WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as reports_this_week,
                (SELECT COUNT(*) FROM user_strikes WHERE is_active = 1) as active_strikes,
                (SELECT COUNT(*) FROM scripts WHERE isDeleted = 1 AND deletedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as deleted_scripts_month,
                (SELECT COUNT(*) FROM comments WHERE is_deleted = 1 AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as deleted_comments_month
        `;
        const [rows] = await dbConnection.query(query);
        return rows[0];
    }

    // Cleanup expired strikes
    async cleanupExpiredStrikes() {
        const query = `
            UPDATE user_strikes 
            SET is_active = 0 
            WHERE is_active = 1 AND expires_at < NOW()
        `;
        const [result] = await dbConnection.query(query);
        return result.affectedRows;
    }
}

export default ModerationService;
