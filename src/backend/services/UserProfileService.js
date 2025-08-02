import dbConnection from "../database.js";

class UserProfileService {
    async updateProfile(userId, profileData) {
        const { bio, status, theme, notifications_enabled, email_notifications, privacy_profile } = profileData;
        const query = `
            UPDATE users 
            SET bio = ?, status = ?, theme = ?, notifications_enabled = ?, 
                email_notifications = ?, privacy_profile = ?, last_active = CURRENT_TIMESTAMP
            WHERE discord_id = ?
        `;
        const [result] = await dbConnection.query(query, [
            bio, status, theme, notifications_enabled, email_notifications, privacy_profile, userId
        ]);
        return result.affectedRows > 0;
    }

    async getUserProfile(userId) {
        const query = `
            SELECT 
                u.*,
                (SELECT COUNT(*) FROM scripts WHERE authorId = u.discord_id AND isDeleted = 0) as scripts_count,
                (SELECT COUNT(*) FROM follows WHERE follower_id = u.discord_id) as following_count,
                (SELECT COUNT(*) FROM follows WHERE following_id = u.discord_id) as followers_count,
                (SELECT AVG(r.rating) FROM ratings r 
                 JOIN scripts s ON r.script_id = s.id 
                 WHERE s.authorId = u.discord_id) as average_rating
            FROM users u 
            WHERE u.discord_id = ?
        `;
        const [rows] = await dbConnection.query(query, [userId]);
        return rows[0] || null;
    }

    async getUserStats(userId) {
        const query = `
            SELECT 
                COUNT(DISTINCT s.id) as total_scripts,
                COALESCE(SUM(s.downloads), 0) as total_downloads,
                COALESCE(SUM(s.views), 0) as total_views,
                COALESCE(AVG(s.rating_average), 0) as average_rating,
                COUNT(DISTINCT r.id) as total_reviews_given,
                COUNT(DISTINCT f.id) as total_followers
            FROM users u
            LEFT JOIN scripts s ON s.authorId = u.discord_id AND s.isDeleted = 0
            LEFT JOIN ratings r ON r.user_id = u.discord_id
            LEFT JOIN follows f ON f.following_id = u.discord_id
            WHERE u.discord_id = ?
            GROUP BY u.discord_id
        `;
        const [rows] = await dbConnection.query(query, [userId]);
        return rows[0] || {
            total_scripts: 0,
            total_downloads: 0,
            total_views: 0,
            average_rating: 0,
            total_reviews_given: 0,
            total_followers: 0
        };
    }

    async getUserActivity(userId, limit = 20) {
        const query = `
            (SELECT 'script_upload' as type, id as target_id, title as title, date as created_at
             FROM scripts WHERE authorId = ? AND isDeleted = 0)
            UNION ALL
            (SELECT 'comment' as type, script_id as target_id, LEFT(content, 100) as title, created_at
             FROM comments WHERE user_id = ? AND is_deleted = 0)
            UNION ALL
            (SELECT 'rating' as type, script_id as target_id, CONCAT('Rated ', rating, ' stars') as title, created_at
             FROM ratings WHERE user_id = ?)
            ORDER BY created_at DESC
            LIMIT ?
        `;
        const [rows] = await dbConnection.query(query, [userId, userId, userId, limit]);
        return rows;
    }

    async searchUsers(query, limit = 20) {
        const searchQuery = `
            SELECT discord_id, username, avatar, bio, 
                   (SELECT COUNT(*) FROM scripts WHERE authorId = u.discord_id AND isDeleted = 0) as scripts_count,
                   (SELECT COUNT(*) FROM follows WHERE following_id = u.discord_id) as followers_count
            FROM users u
            WHERE (username LIKE ? OR bio LIKE ?) AND privacy_profile = 'public'
            ORDER BY scripts_count DESC, followers_count DESC
            LIMIT ?
        `;
        const searchTerm = `%${query}%`;
        const [rows] = await dbConnection.query(searchQuery, [searchTerm, searchTerm, limit]);
        return rows;
    }
}

export default UserProfileService;
