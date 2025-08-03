import dbConnection from "../database.js";

class NotificationService {
    async createNotification(userId, type, title, message, data = null) {
        const query = `
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES (?, ?, ?, ?, ?)
        `;
        const dataJson = data ? JSON.stringify(data) : null;
        const [result] = await dbConnection.query(query, [userId, type, title, message, dataJson]);
        return result.insertId;
    }

    async getUserNotifications(userId, limit = 20, offset = 0, unreadOnly = false) {
        const unreadClause = unreadOnly ? "AND is_read = 0" : "";
        const query = `
            SELECT *
            FROM notifications
            WHERE user_id = ? ${unreadClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await dbConnection.query(query, [userId, limit, offset]);
        
        // Parse JSON data for each notification
        return rows.map(notification => ({
            ...notification,
            data: notification.data ? JSON.parse(notification.data) : null
        }));
    }

    async markAsRead(notificationId, userId) {
        const query = "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?";
        const [result] = await dbConnection.query(query, [notificationId, userId]);
        return result.affectedRows > 0;
    }

    async markAllAsRead(userId) {
        const query = "UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0";
        const [result] = await dbConnection.query(query, [userId]);
        return result.affectedRows;
    }

    async deleteNotification(notificationId, userId) {
        const query = "DELETE FROM notifications WHERE id = ? AND user_id = ?";
        const [result] = await dbConnection.query(query, [notificationId, userId]);
        return result.affectedRows > 0;
    }

    async getUnreadCount(userId) {
        const query = "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0";
        const [rows] = await dbConnection.query(query, [userId]);
        return rows[0].count;
    }

    // Notification helpers for specific events
    async notifyScriptApproved(userId, scriptTitle, scriptId) {
        return await this.createNotification(
            userId,
            'script_approved',
            'Script Approved!',
            `Your script "${scriptTitle}" has been approved and is now live.`,
            { script_id: scriptId, script_title: scriptTitle }
        );
    }

    async notifyScriptRejected(userId, scriptTitle, reason) {
        return await this.createNotification(
            userId,
            'script_rejected',
            'Script Rejected',
            `Your script "${scriptTitle}" was rejected. Reason: ${reason}`,
            { script_title: scriptTitle, reason }
        );
    }

    async notifyNewComment(userId, scriptTitle, commenterId, commenterName) {
        return await this.createNotification(
            userId,
            'new_comment',
            'New Comment',
            `${commenterName} commented on your script "${scriptTitle}".`,
            { script_title: scriptTitle, commenter_id: commenterId, commenter_name: commenterName }
        );
    }

    async notifyNewRating(userId, scriptTitle, rating, reviewerId, reviewerName) {
        return await this.createNotification(
            userId,
            'new_rating',
            'New Rating',
            `${reviewerName} rated your script "${scriptTitle}" ${rating} stars.`,
            { script_title: scriptTitle, rating, reviewer_id: reviewerId, reviewer_name: reviewerName }
        );
    }

    async notifyNewFollower(userId, followerId, followerName) {
        return await this.createNotification(
            userId,
            'new_follower',
            'New Follower',
            `${followerName} started following you.`,
            { follower_id: followerId, follower_name: followerName }
        );
    }

    async notifyScriptAdded(userId, collectionName, scriptTitle, adderId, adderName) {
        return await this.createNotification(
            userId,
            'script_added_to_collection',
            'Script Added to Collection',
            `${adderName} added your script "${scriptTitle}" to their collection "${collectionName}".`,
            { collection_name: collectionName, script_title: scriptTitle, adder_id: adderId }
        );
    }

    // Clean up old notifications (run this periodically)
    async cleanupOldNotifications(daysOld = 30) {
        const query = `
            DELETE FROM notifications 
            WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
        `;
        const [result] = await dbConnection.query(query, [daysOld]);
        return result.affectedRows;
    }
}

export default NotificationService;
