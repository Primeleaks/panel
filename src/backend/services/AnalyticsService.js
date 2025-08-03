import dbConnection from "../database.js";

class AnalyticsService {
    // User Analytics
    async getUserGrowth(days = 30) {
        const query = `
            SELECT DATE(created) as date, COUNT(*) as new_users
            FROM users
            WHERE created >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(created)
            ORDER BY date ASC
        `;
        const [rows] = await dbConnection.query(query, [days]);
        return rows;
    }

    async getActiveUsers(days = 7) {
        const query = `
            SELECT COUNT(DISTINCT user_id) as active_users
            FROM (
                SELECT authorId as user_id FROM scripts WHERE date >= DATE_SUB(NOW(), INTERVAL ? DAY)
                UNION ALL
                SELECT user_id FROM comments WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                UNION ALL
                SELECT user_id FROM ratings WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            ) as activity
        `;
        const [rows] = await dbConnection.query(query, [days, days, days]);
        return rows[0].active_users;
    }

    async getUserStats() {
        const query = `
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN created >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_month,
                COUNT(CASE WHEN last_active >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as active_users_week
            FROM users
        `;
        const [rows] = await dbConnection.query(query);
        return rows[0];
    }

    // Script Analytics
    async getScriptUploadTrends(days = 30) {
        const query = `
            SELECT 
                DATE(date) as date, 
                COUNT(*) as uploads,
                COUNT(CASE WHEN isApproved = 1 THEN 1 END) as approved,
                COUNT(CASE WHEN isPending = 1 THEN 1 END) as pending
            FROM scripts
            WHERE date >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(date)
            ORDER BY date ASC
        `;
        const [rows] = await dbConnection.query(query, [days]);
        return rows;
    }

    async getScriptStats() {
        const query = `
            SELECT 
                COUNT(*) as total_scripts,
                COUNT(CASE WHEN isDeleted = 0 AND isApproved = 1 THEN 1 END) as active_scripts,
                COUNT(CASE WHEN isPending = 1 THEN 1 END) as pending_scripts,
                COUNT(CASE WHEN isDeleted = 1 THEN 1 END) as deleted_scripts,
                AVG(rating_average) as average_rating,
                SUM(downloads) as total_downloads,
                SUM(views) as total_views
            FROM scripts
        `;
        const [rows] = await dbConnection.query(query);
        return rows[0];
    }

    async getTopScripts(limit = 10, sortBy = 'downloads') {
        const allowedSorts = ['downloads', 'views', 'rating_average', 'rating_count'];
        const sortColumn = allowedSorts.includes(sortBy) ? sortBy : 'downloads';
        
        const query = `
            SELECT id, title, author, ${sortColumn} as metric_value, downloads, views, rating_average, rating_count
            FROM scripts
            WHERE isDeleted = 0 AND isApproved = 1
            ORDER BY ${sortColumn} DESC
            LIMIT ?
        `;
        const [rows] = await dbConnection.query(query, [limit]);
        return rows;
    }

    async getCategoryStats() {
        const query = `
            SELECT 
                category,
                COUNT(*) as script_count,
                AVG(rating_average) as avg_rating,
                SUM(downloads) as total_downloads,
                SUM(views) as total_views
            FROM scripts
            WHERE isDeleted = 0 AND isApproved = 1
            GROUP BY category
            ORDER BY script_count DESC
        `;
        const [rows] = await dbConnection.query(query);
        return rows;
    }

    // Engagement Analytics
    async getEngagementStats() {
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM comments WHERE is_deleted = 0) as total_comments,
                (SELECT COUNT(*) FROM ratings) as total_ratings,
                (SELECT COUNT(*) FROM follows) as total_follows,
                (SELECT COUNT(*) FROM bookmarks) as total_bookmarks,
                (SELECT COUNT(*) FROM collections WHERE is_public = 1) as public_collections,
                (SELECT AVG(rating) FROM ratings) as average_rating_given
        `;
        const [rows] = await dbConnection.query(query);
        return rows[0];
    }

    async getCommentTrends(days = 30) {
        const query = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as comments
            FROM comments
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND is_deleted = 0
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `;
        const [rows] = await dbConnection.query(query, [days]);
        return rows;
    }

    // Popular Content
    async getTrendingScripts(days = 7, limit = 10) {
        const query = `
            SELECT s.id, s.title, s.author, s.category, s.imgurLink,
                   COUNT(DISTINCT r.id) as recent_ratings,
                   COUNT(DISTINCT c.id) as recent_comments,
                   s.views, s.downloads, s.rating_average
            FROM scripts s
            LEFT JOIN ratings r ON s.id = r.script_id AND r.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            LEFT JOIN comments c ON s.id = c.script_id AND c.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND c.is_deleted = 0
            WHERE s.isDeleted = 0 AND s.isApproved = 1
            GROUP BY s.id
            ORDER BY (recent_ratings * 2 + recent_comments + s.downloads * 0.1) DESC
            LIMIT ?
        `;
        const [rows] = await dbConnection.query(query, [days, days, limit]);
        return rows;
    }

    async getTopUsers(limit = 10, sortBy = 'scripts') {
        let query;
        
        switch (sortBy) {
            case 'followers':
                query = `
                    SELECT u.discord_id, u.username, u.avatar, COUNT(f.id) as followers
                    FROM users u
                    LEFT JOIN follows f ON u.discord_id = f.following_id
                    GROUP BY u.discord_id
                    ORDER BY followers DESC
                    LIMIT ?
                `;
                break;
            case 'ratings':
                query = `
                    SELECT u.discord_id, u.username, u.avatar, COUNT(r.id) as ratings_given
                    FROM users u
                    LEFT JOIN ratings r ON u.discord_id = r.user_id
                    GROUP BY u.discord_id
                    ORDER BY ratings_given DESC
                    LIMIT ?
                `;
                break;
            default: // scripts
                query = `
                    SELECT u.discord_id, u.username, u.avatar, COUNT(s.id) as scripts_count,
                           COALESCE(SUM(s.downloads), 0) as total_downloads
                    FROM users u
                    LEFT JOIN scripts s ON u.discord_id = s.authorId AND s.isDeleted = 0 AND s.isApproved = 1
                    GROUP BY u.discord_id
                    ORDER BY scripts_count DESC, total_downloads DESC
                    LIMIT ?
                `;
        }
        
        const [rows] = await dbConnection.query(query, [limit]);
        return rows;
    }

    // System Health
    async getSystemHealth() {
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports,
                (SELECT COUNT(*) FROM user_strikes WHERE is_active = 1) as active_strikes,
                (SELECT COUNT(*) FROM scripts WHERE isPending = 1) as pending_approvals,
                (SELECT COUNT(*) FROM blacklist) as blacklisted_users
        `;
        const [rows] = await dbConnection.query(query);
        return rows[0];
    }

    // Dashboard Summary
    async getDashboardStats() {
        const userStats = await this.getUserStats();
        const scriptStats = await this.getScriptStats();
        const engagementStats = await this.getEngagementStats();
        const systemHealth = await this.getSystemHealth();
        const activeUsers = await this.getActiveUsers(7);

        return {
            users: {
                ...userStats,
                active_users_week: activeUsers
            },
            scripts: scriptStats,
            engagement: engagementStats,
            system: systemHealth
        };
    }

    async getTopUsers(limit = 10) {
        const query = `
            SELECT 
                u.discord_id,
                u.username,
                COUNT(s.id) as script_count,
                SUM(s.downloads) as total_downloads,
                AVG(s.rating_average) as avg_rating,
                (SELECT COUNT(*) FROM follows WHERE following_id = u.discord_id) as follower_count
            FROM users u
            LEFT JOIN scripts s ON u.discord_id = s.authorId AND s.isDeleted = 0 AND s.isApproved = 1
            GROUP BY u.discord_id, u.username
            HAVING script_count > 0
            ORDER BY total_downloads DESC, script_count DESC
            LIMIT ?
        `;
        const [rows] = await dbConnection.query(query, [limit]);
        return rows;
    }

    // Enhanced dashboard stats with time range support
    async getDashboardStats(timeRange = '30') {
        const days = parseInt(timeRange);
        
        const userStats = await this.getUserStats();
        const scriptStats = await this.getScriptStats();
        const engagementStats = await this.getEngagementStats();
        const systemHealth = await this.getSystemHealth();
        const activeUsers = await this.getActiveUsers(7);

        return {
            totalUsers: userStats.total_users,
            activeUsersWeek: activeUsers,
            totalScripts: scriptStats.total_scripts,
            totalDownloads: scriptStats.total_downloads,
            totalComments: engagementStats.total_comments,
            averageRating: scriptStats.average_rating
        };
    }

    // Revenue/Download analytics (if you plan to monetize)
    async getDownloadStats(days = 30) {
        const query = `
            SELECT 
                SUM(downloads) as total_downloads,
                COUNT(DISTINCT authorId) as authors_with_downloads,
                AVG(downloads) as avg_downloads_per_script
            FROM scripts
            WHERE isDeleted = 0 AND isApproved = 1 AND date >= DATE_SUB(NOW(), INTERVAL ? DAY)
        `;
        const [rows] = await dbConnection.query(query, [days]);
        return rows[0];
    }

    // Real-time stats (for live dashboard)
    async getRealTimeStats() {
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM scripts WHERE date >= DATE_SUB(NOW(), INTERVAL 1 HOUR)) as scripts_last_hour,
                (SELECT COUNT(*) FROM comments WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)) as comments_last_hour,
                (SELECT COUNT(*) FROM ratings WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)) as ratings_last_hour,
                (SELECT COUNT(*) FROM users WHERE created >= DATE_SUB(NOW(), INTERVAL 1 HOUR)) as users_last_hour
        `;
        const [rows] = await dbConnection.query(query);
        return rows[0];
    }
}

export default AnalyticsService;
