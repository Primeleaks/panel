import dbConnection from "../database.js";

class SocialService {
    // Follow/Unfollow functionality
    async followUser(followerId, followingId) {
        if (followerId === followingId) {
            throw new Error("Cannot follow yourself");
        }

        const query = `
            INSERT IGNORE INTO follows (follower_id, following_id)
            VALUES (?, ?)
        `;
        const [result] = await dbConnection.query(query, [followerId, followingId]);
        return result.affectedRows > 0;
    }

    async unfollowUser(followerId, followingId) {
        const query = "DELETE FROM follows WHERE follower_id = ? AND following_id = ?";
        const [result] = await dbConnection.query(query, [followerId, followingId]);
        return result.affectedRows > 0;
    }

    async isFollowing(followerId, followingId) {
        const query = "SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ? LIMIT 1";
        const [rows] = await dbConnection.query(query, [followerId, followingId]);
        return rows.length > 0;
    }

    async getFollowers(userId, limit = 20, offset = 0) {
        const query = `
            SELECT u.discord_id, u.username, u.avatar, u.bio, f.created_at as followed_at
            FROM follows f
            JOIN users u ON f.follower_id = u.discord_id
            WHERE f.following_id = ?
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await dbConnection.query(query, [userId, limit, offset]);
        return rows;
    }

    async getFollowing(userId, limit = 20, offset = 0) {
        const query = `
            SELECT u.discord_id, u.username, u.avatar, u.bio, f.created_at as followed_at
            FROM follows f
            JOIN users u ON f.following_id = u.discord_id
            WHERE f.follower_id = ?
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await dbConnection.query(query, [userId, limit, offset]);
        return rows;
    }

    // Activity Feed
    async getActivityFeed(userId, limit = 50) {
        // Get activities from users the current user follows
        const query = `
            (SELECT 'script_upload' as type, s.id as target_id, s.title, s.imgurLink as image, 
                    u.username, u.avatar, s.date as created_at, s.authorId as user_id
             FROM scripts s
             JOIN users u ON s.authorId = u.discord_id
             JOIN follows f ON f.following_id = s.authorId
             WHERE f.follower_id = ? AND s.isDeleted = 0 AND s.isApproved = 1)
            UNION ALL
            (SELECT 'rating' as type, r.script_id as target_id, 
                    CONCAT('Rated "', s.title, '" ', r.rating, ' stars') as title,
                    s.imgurLink as image, u.username, u.avatar, r.created_at, r.user_id
             FROM ratings r
             JOIN scripts s ON r.script_id = s.id
             JOIN users u ON r.user_id = u.discord_id
             JOIN follows f ON f.following_id = r.user_id
             WHERE f.follower_id = ? AND s.isDeleted = 0 AND r.review IS NOT NULL)
            ORDER BY created_at DESC
            LIMIT ?
        `;
        const [rows] = await dbConnection.query(query, [userId, userId, limit]);
        return rows;
    }

    // Collections
    async createCollection(userId, name, description = null, isPublic = true) {
        const query = `
            INSERT INTO collections (user_id, name, description, is_public)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await dbConnection.query(query, [userId, name, description, isPublic]);
        return result.insertId;
    }

    async updateCollection(collectionId, userId, name, description, isPublic) {
        const query = `
            UPDATE collections 
            SET name = ?, description = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
        `;
        const [result] = await dbConnection.query(query, [name, description, isPublic, collectionId, userId]);
        return result.affectedRows > 0;
    }

    async deleteCollection(collectionId, userId) {
        // First delete all scripts from the collection
        await dbConnection.query("DELETE FROM collection_scripts WHERE collection_id = ?", [collectionId]);
        
        // Then delete the collection
        const query = "DELETE FROM collections WHERE id = ? AND user_id = ?";
        const [result] = await dbConnection.query(query, [collectionId, userId]);
        return result.affectedRows > 0;
    }

    async getUserCollections(userId, includePrivate = false) {
        const privateClause = includePrivate ? "" : "AND is_public = 1";
        const query = `
            SELECT c.*, 
                   (SELECT COUNT(*) FROM collection_scripts WHERE collection_id = c.id) as script_count
            FROM collections c
            WHERE c.user_id = ? ${privateClause}
            ORDER BY c.updated_at DESC
        `;
        const [rows] = await dbConnection.query(query, [userId]);
        return rows;
    }

    async getCollection(collectionId, requestingUserId = null) {
        const query = `
            SELECT c.*, u.username, u.avatar,
                   (SELECT COUNT(*) FROM collection_scripts WHERE collection_id = c.id) as script_count
            FROM collections c
            JOIN users u ON c.user_id = u.discord_id
            WHERE c.id = ?
        `;
        const [rows] = await dbConnection.query(query, [collectionId]);
        const collection = rows[0];
        
        if (!collection) return null;
        
        // Check if user can view this collection
        if (!collection.is_public && collection.user_id !== requestingUserId) {
            return null;
        }
        
        return collection;
    }

    async addScriptToCollection(collectionId, scriptId, userId) {
        // Verify the collection belongs to the user
        const collectionQuery = "SELECT user_id FROM collections WHERE id = ?";
        const [collectionRows] = await dbConnection.query(collectionQuery, [collectionId]);
        
        if (!collectionRows.length || collectionRows[0].user_id !== userId) {
            throw new Error("Collection not found or access denied");
        }

        const query = `
            INSERT IGNORE INTO collection_scripts (collection_id, script_id)
            VALUES (?, ?)
        `;
        const [result] = await dbConnection.query(query, [collectionId, scriptId]);
        return result.affectedRows > 0;
    }

    async removeScriptFromCollection(collectionId, scriptId, userId) {
        // Verify the collection belongs to the user
        const collectionQuery = "SELECT user_id FROM collections WHERE id = ?";
        const [collectionRows] = await dbConnection.query(collectionQuery, [collectionId]);
        
        if (!collectionRows.length || collectionRows[0].user_id !== userId) {
            throw new Error("Collection not found or access denied");
        }

        const query = "DELETE FROM collection_scripts WHERE collection_id = ? AND script_id = ?";
        const [result] = await dbConnection.query(query, [collectionId, scriptId]);
        return result.affectedRows > 0;
    }

    async getCollectionScripts(collectionId, limit = 20, offset = 0) {
        const query = `
            SELECT s.*, cs.added_at
            FROM collection_scripts cs
            JOIN scripts s ON cs.script_id = s.id
            WHERE cs.collection_id = ? AND s.isDeleted = 0 AND s.isApproved = 1
            ORDER BY cs.added_at DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await dbConnection.query(query, [collectionId, limit, offset]);
        return rows;
    }

    // Bookmarks
    async addBookmark(userId, scriptId) {
        const query = `
            INSERT IGNORE INTO bookmarks (user_id, script_id)
            VALUES (?, ?)
        `;
        const [result] = await dbConnection.query(query, [userId, scriptId]);
        return result.affectedRows > 0;
    }

    async removeBookmark(userId, scriptId) {
        const query = "DELETE FROM bookmarks WHERE user_id = ? AND script_id = ?";
        const [result] = await dbConnection.query(query, [userId, scriptId]);
        return result.affectedRows > 0;
    }

    async isBookmarked(userId, scriptId) {
        const query = "SELECT 1 FROM bookmarks WHERE user_id = ? AND script_id = ? LIMIT 1";
        const [rows] = await dbConnection.query(query, [userId, scriptId]);
        return rows.length > 0;
    }

    async getUserBookmarks(userId, limit = 20, offset = 0) {
        const query = `
            SELECT s.*, b.created_at as bookmarked_at
            FROM bookmarks b
            JOIN scripts s ON b.script_id = s.id
            WHERE b.user_id = ? AND s.isDeleted = 0 AND s.isApproved = 1
            ORDER BY b.created_at DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await dbConnection.query(query, [userId, limit, offset]);
        return rows;
    }
}

export default SocialService;
