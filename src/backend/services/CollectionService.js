import dbConnection from "../database.js";
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Check if collections feature is enabled
const ENABLE_COLLECTIONS = process.env.ENABLE_COLLECTIONS !== 'false';
const ENABLE_ANALYTICS = process.env.ENABLE_ANALYTICS !== 'false';
const ENABLE_BOOKMARKS = process.env.ENABLE_BOOKMARKS !== 'false';
const ENABLE_SHARING = process.env.ENABLE_SHARING !== 'false';
const SITE_URL = process.env.SITE_URL || 'http://localhost:5173';

// Share token expiration time (30 days in seconds)
const SHARE_TOKEN_EXPIRATION = 30 * 24 * 60 * 60;

class CollectionService {
    async createCollection(userId, name, description, isPrivate = false) {
        if (!ENABLE_COLLECTIONS) {
            throw new Error("Collections feature is disabled");
        }
        
        const query = `
            INSERT INTO collections (user_id, name, description, is_private)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await dbConnection.query(query, [userId, name, description, isPrivate]);
        
        // Initialize analytics for this collection
        if (ENABLE_ANALYTICS) {
            await this.initializeAnalytics(result.insertId);
        }
        
        return result.insertId;
    }

    async getCollection(collectionId, userId = null, ipAddress = null) {
        if (!ENABLE_COLLECTIONS) {
            throw new Error("Collections feature is disabled");
        }
        
        // If userId is provided, it means we're checking if this user can view the collection
        const privacyClause = userId ? 
            "(is_private = 0 OR user_id = ?)" : 
            "is_private = 0";
        
        const params = userId ? [collectionId, userId] : [collectionId];
        
        const query = `
            SELECT c.*, u.username as creator_name, u.avatar as creator_avatar,
                   (SELECT COUNT(*) FROM collection_items WHERE collection_id = c.id) as item_count
            FROM collections c
            JOIN users u ON c.user_id = u.discord_id
            WHERE c.id = ? AND ${privacyClause} AND c.is_deleted = 0
        `;
        
        const [rows] = await dbConnection.query(query, params);
        
        if (rows.length === 0) {
            return null;
        }
        
        // Get collection items
        const collection = rows[0];
        collection.items = await this.getCollectionItems(collectionId);
        
        // Get analytics data if enabled
        if (ENABLE_ANALYTICS) {
            const analytics = await this.getCollectionAnalytics(collectionId);
            collection.analytics = analytics;
            
            // Record view
            await this.recordCollectionView(collectionId, userId, ipAddress);
        }
        
        // Check if user has bookmarked this collection
        if (ENABLE_BOOKMARKS && userId) {
            collection.isBookmarked = await this.isCollectionBookmarked(userId, collectionId);
        }
        
        return collection;
    }

    async getUserCollections(userId, includePrivate = true) {
        const privacyClause = includePrivate ? "" : "AND is_private = 0";
        
        const query = `
            SELECT c.*, 
                   (SELECT COUNT(*) FROM collection_items WHERE collection_id = c.id) as item_count
            FROM collections c
            WHERE c.user_id = ? ${privacyClause} AND c.is_deleted = 0
            ORDER BY c.created_at DESC
        `;
        
        const [rows] = await dbConnection.query(query, [userId]);
        return rows;
    }

    async getFeaturedCollections(limit = 5) {
        const query = `
            SELECT c.*, u.username as creator_name, u.avatar as creator_avatar,
                   (SELECT COUNT(*) FROM collection_items WHERE collection_id = c.id) as item_count
            FROM collections c
            JOIN users u ON c.user_id = u.discord_id
            WHERE c.is_featured = 1 AND c.is_private = 0 AND c.is_deleted = 0
            ORDER BY c.updated_at DESC
            LIMIT ?
        `;
        
        const [rows] = await dbConnection.query(query, [limit]);
        
        // Get collection items for each collection
        for (let collection of rows) {
            collection.items = await this.getCollectionItems(collection.id, 3); // Limit preview items
        }
        
        return rows;
    }

    async updateCollection(collectionId, userId, data, isAdmin = false) {
        const { name, description, isPrivate, isFeatured } = data;
        
        // Check if user can update this collection
        if (!isAdmin) {
            const collection = await this.getCollectionById(collectionId);
            if (!collection || collection.user_id !== userId) {
                throw new Error("Unauthorized");
            }
        }
        
        let query = `
            UPDATE collections 
            SET name = ?, description = ?, is_private = ?, updated_at = CURRENT_TIMESTAMP
        `;
        
        const params = [name, description, isPrivate];
        
        // Only admins can update featured status
        if (isAdmin && isFeatured !== undefined) {
            query += ", is_featured = ?";
            params.push(isFeatured);
        }
        
        query += " WHERE id = ?";
        params.push(collectionId);
        
        const [result] = await dbConnection.query(query, params);
        return result.affectedRows > 0;
    }

    async deleteCollection(collectionId, userId, isAdmin = false) {
        // Check if user can delete this collection
        if (!isAdmin) {
            const collection = await this.getCollectionById(collectionId);
            if (!collection || collection.user_id !== userId) {
                throw new Error("Unauthorized");
            }
        }
        
        const query = `
            UPDATE collections 
            SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        const [result] = await dbConnection.query(query, [collectionId]);
        return result.affectedRows > 0;
    }

    async addToCollection(collectionId, scriptId, userId, isAdmin = false) {
        // Check if user can add to this collection
        if (!isAdmin) {
            const collection = await this.getCollectionById(collectionId);
            if (!collection || collection.user_id !== userId) {
                throw new Error("Unauthorized");
            }
        }
        
        // Check if item already exists in collection
        const existsQuery = `
            SELECT COUNT(*) as count
            FROM collection_items
            WHERE collection_id = ? AND script_id = ?
        `;
        
        const [existsResult] = await dbConnection.query(existsQuery, [collectionId, scriptId]);
        
        if (existsResult[0].count > 0) {
            throw new Error("Script already exists in this collection");
        }
        
        // Add item to collection
        const query = `
            INSERT INTO collection_items (collection_id, script_id)
            VALUES (?, ?)
        `;
        
        const [result] = await dbConnection.query(query, [collectionId, scriptId]);
        
        // Update collection's updated_at timestamp
        await dbConnection.query(
            "UPDATE collections SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [collectionId]
        );
        
        return result.insertId;
    }

    async removeFromCollection(collectionId, scriptId, userId, isAdmin = false) {
        // Check if user can remove from this collection
        if (!isAdmin) {
            const collection = await this.getCollectionById(collectionId);
            if (!collection || collection.user_id !== userId) {
                throw new Error("Unauthorized");
            }
        }
        
        const query = `
            DELETE FROM collection_items
            WHERE collection_id = ? AND script_id = ?
        `;
        
        const [result] = await dbConnection.query(query, [collectionId, scriptId]);
        
        // Update collection's updated_at timestamp
        await dbConnection.query(
            "UPDATE collections SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [collectionId]
        );
        
        return result.affectedRows > 0;
    }

    async getCollectionItems(collectionId, limit = null) {
        let limitClause = "";
        const params = [collectionId];
        
        if (limit) {
            limitClause = "LIMIT ?";
            params.push(limit);
        }
        
        const query = `
            SELECT s.*, ci.added_at
            FROM collection_items ci
            JOIN scripts s ON ci.script_id = s.id
            WHERE ci.collection_id = ? AND s.isDeleted = 0 AND s.isApproved = 1
            ORDER BY ci.added_at DESC
            ${limitClause}
        `;
        
        const [rows] = await dbConnection.query(query, params);
        return rows;
    }
    
    async getCollectionById(collectionId) {
        const query = "SELECT * FROM collections WHERE id = ? AND is_deleted = 0";
        const [rows] = await dbConnection.query(query, [collectionId]);
        return rows[0] || null;
    }
    
    // Bookmark methods
    async bookmarkCollection(userId, collectionId) {
        if (!ENABLE_BOOKMARKS) {
            throw new Error("Bookmarks feature is disabled");
        }
        
        try {
            const query = `
                INSERT INTO collection_bookmarks (user_id, collection_id)
                VALUES (?, ?)
            `;
            await dbConnection.query(query, [userId, collectionId]);
            
            // Update bookmark count in analytics
            if (ENABLE_ANALYTICS) {
                await dbConnection.query(`
                    UPDATE collection_analytics
                    SET bookmark_count = bookmark_count + 1
                    WHERE collection_id = ?
                `, [collectionId]);
            }
            
            return true;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                // Already bookmarked
                return false;
            }
            throw error;
        }
    }
    
    async unbookmarkCollection(userId, collectionId) {
        if (!ENABLE_BOOKMARKS) {
            throw new Error("Bookmarks feature is disabled");
        }
        
        const query = `
            DELETE FROM collection_bookmarks
            WHERE user_id = ? AND collection_id = ?
        `;
        const [result] = await dbConnection.query(query, [userId, collectionId]);
        
        // Update bookmark count in analytics
        if (result.affectedRows > 0 && ENABLE_ANALYTICS) {
            await dbConnection.query(`
                UPDATE collection_analytics
                SET bookmark_count = GREATEST(bookmark_count - 1, 0)
                WHERE collection_id = ?
            `, [collectionId]);
        }
        
        return result.affectedRows > 0;
    }
    
    async getUserBookmarks(userId) {
        if (!ENABLE_BOOKMARKS) {
            throw new Error("Bookmarks feature is disabled");
        }
        
        const query = `
            SELECT c.*, u.username as creator_name, u.avatar as creator_avatar,
                   (SELECT COUNT(*) FROM collection_items WHERE collection_id = c.id) as item_count,
                   b.created_at as bookmarked_at
            FROM collection_bookmarks b
            JOIN collections c ON b.collection_id = c.id
            JOIN users u ON c.user_id = u.discord_id
            WHERE b.user_id = ? AND c.is_deleted = 0
            ORDER BY b.created_at DESC
        `;
        
        const [rows] = await dbConnection.query(query, [userId]);
        return rows;
    }
    
    async isCollectionBookmarked(userId, collectionId) {
        if (!ENABLE_BOOKMARKS) {
            return false;
        }
        
        const query = `
            SELECT COUNT(*) as count
            FROM collection_bookmarks
            WHERE user_id = ? AND collection_id = ?
        `;
        
        const [rows] = await dbConnection.query(query, [userId, collectionId]);
        return rows[0].count > 0;
    }
    
    // Analytics methods
    async initializeAnalytics(collectionId) {
        if (!ENABLE_ANALYTICS) {
            return null;
        }
        
        const query = `
            INSERT INTO collection_analytics (collection_id)
            VALUES (?)
            ON DUPLICATE KEY UPDATE last_updated = CURRENT_TIMESTAMP
        `;
        
        const [result] = await dbConnection.query(query, [collectionId]);
        return result.insertId;
    }
    
    async recordCollectionView(collectionId, userId = null, ipAddress = null) {
        if (!ENABLE_ANALYTICS) {
            return;
        }
        
        // Add view to log
        const logQuery = `
            INSERT INTO collection_views (collection_id, user_id, ip_address)
            VALUES (?, ?, ?)
        `;
        await dbConnection.query(logQuery, [collectionId, userId, ipAddress]);
        
        // Update view count
        const updateQuery = `
            UPDATE collection_analytics
            SET view_count = view_count + 1
            WHERE collection_id = ?
        `;
        await dbConnection.query(updateQuery, [collectionId]);
    }
    
    async getCollectionAnalytics(collectionId) {
        if (!ENABLE_ANALYTICS) {
            return { view_count: 0, bookmark_count: 0, share_count: 0 };
        }
        
        const query = `
            SELECT * FROM collection_analytics
            WHERE collection_id = ?
        `;
        
        const [rows] = await dbConnection.query(query, [collectionId]);
        return rows[0] || { view_count: 0, bookmark_count: 0, share_count: 0 };
    }
    
    async getCollectionViewsByDate(collectionId, days = 30) {
        if (!ENABLE_ANALYTICS) {
            return [];
        }
        
        const query = `
            SELECT 
                DATE(viewed_at) as date,
                COUNT(*) as count
            FROM collection_views
            WHERE collection_id = ? AND viewed_at >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
            GROUP BY DATE(viewed_at)
            ORDER BY date ASC
        `;
        
        const [rows] = await dbConnection.query(query, [collectionId, days]);
        return rows;
    }
    
    // Sharing methods
    async createShareLink(collectionId, userId, expiresInHours = null) {
        // Verify the collection exists and user has access to share it
        const collection = await this.getCollectionById(collectionId);
        if (!collection) {
            throw new Error("Collection not found");
        }
        
        if (collection.user_id !== userId && !collection.is_private) {
            throw new Error("You don't have permission to share this collection");
        }
        
        // Generate a unique token
        const shareToken = uuidv4();
        
        // Calculate expiry time if provided
        let expiresAt = null;
        if (expiresInHours) {
            expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + expiresInHours);
        }
        
        // Store the share
        const query = `
            INSERT INTO collection_shares (collection_id, user_id, share_token, expires_at)
            VALUES (?, ?, ?, ?)
        `;
        
        await dbConnection.query(query, [collectionId, userId, shareToken, expiresAt]);
        
        // Update share count in analytics
        if (ENABLE_ANALYTICS) {
            await dbConnection.query(`
                UPDATE collection_analytics
                SET share_count = share_count + 1
                WHERE collection_id = ?
            `, [collectionId]);
        }
        
        // Return the share URL
        return `${SITE_URL}/shared/collection/${shareToken}`;
    }
    
    async getCollectionByShareToken(shareToken) {
        const query = `
            SELECT c.*, s.expires_at
            FROM collection_shares s
            JOIN collections c ON s.collection_id = c.id
            WHERE s.share_token = ?
              AND (s.expires_at IS NULL OR s.expires_at > CURRENT_TIMESTAMP)
              AND c.is_deleted = 0
        `;
        
        const [rows] = await dbConnection.query(query, [shareToken]);
        if (rows.length === 0) {
            return null;
        }
        
        // Get collection items
        const collection = rows[0];
        collection.items = await this.getCollectionItems(collection.id);
        
        // Record view through share link
        if (ENABLE_ANALYTICS) {
            await this.recordCollectionView(collection.id, null, null);
        }
        
        return collection;
    }

    async searchCollections(query, limit = 20) {
        const searchQuery = `
            SELECT c.*, u.username as creator_name, u.avatar as creator_avatar,
                   (SELECT COUNT(*) FROM collection_items WHERE collection_id = c.id) as item_count
            FROM collections c
            JOIN users u ON c.user_id = u.discord_id
            WHERE c.is_private = 0 AND c.is_deleted = 0 
                AND (c.name LIKE ? OR c.description LIKE ?)
            ORDER BY c.is_featured DESC, c.updated_at DESC
            LIMIT ?
        `;
        
        const searchParam = `%${query}%`;
        const [rows] = await dbConnection.query(searchQuery, [searchParam, searchParam, limit]);
        
        return rows;
    }
    
    async getCollectionOwner(collectionId) {
        const query = `
            SELECT user_id
            FROM collections
            WHERE id = ? AND is_deleted = 0
        `;
        
        const [rows] = await dbConnection.query(query, [collectionId]);
        return rows;
    }

    // =========================
    // Bookmark functionality
    // =========================
    async addBookmark(userId, collectionId) {
        if (!ENABLE_BOOKMARKS) {
            throw new Error("Bookmarks feature is disabled");
        }

        // Check if user has already bookmarked this collection
        const [existing] = await dbConnection.query(
            'SELECT * FROM collection_bookmarks WHERE user_id = ? AND collection_id = ?',
            [userId, collectionId]
        );

        if (existing.length > 0) {
            return false; // Already bookmarked
        }

        // Add the bookmark
        await dbConnection.query(
            'INSERT INTO collection_bookmarks (user_id, collection_id) VALUES (?, ?)',
            [userId, collectionId]
        );

        // Update bookmark count in analytics
        if (ENABLE_ANALYTICS) {
            await dbConnection.query(
                'UPDATE collection_analytics SET bookmark_count = bookmark_count + 1 WHERE collection_id = ?',
                [collectionId]
            );
        }

        return true;
    }

    async removeBookmark(userId, collectionId) {
        if (!ENABLE_BOOKMARKS) {
            throw new Error("Bookmarks feature is disabled");
        }

        // Remove the bookmark
        const [result] = await dbConnection.query(
            'DELETE FROM collection_bookmarks WHERE user_id = ? AND collection_id = ?',
            [userId, collectionId]
        );

        if (result.affectedRows > 0 && ENABLE_ANALYTICS) {
            // Update bookmark count in analytics
            await dbConnection.query(
                'UPDATE collection_analytics SET bookmark_count = GREATEST(bookmark_count - 1, 0) WHERE collection_id = ?',
                [collectionId]
            );
        }

        return result.affectedRows > 0;
    }

    async isCollectionBookmarked(userId, collectionId) {
        if (!ENABLE_BOOKMARKS || !userId) {
            return false;
        }

        const [rows] = await dbConnection.query(
            'SELECT 1 FROM collection_bookmarks WHERE user_id = ? AND collection_id = ?',
            [userId, collectionId]
        );

        return rows.length > 0;
    }

    async getUserBookmarkedCollections(userId) {
        if (!ENABLE_BOOKMARKS) {
            throw new Error("Bookmarks feature is disabled");
        }

        const query = `
            SELECT c.*, u.username as creator_name, u.avatar as creator_avatar,
                   (SELECT COUNT(*) FROM collection_items WHERE collection_id = c.id) as item_count,
                   b.created_at as bookmarked_at
            FROM collection_bookmarks b
            JOIN collections c ON b.collection_id = c.id
            JOIN users u ON c.user_id = u.discord_id
            WHERE b.user_id = ? AND c.is_deleted = 0
            ORDER BY b.created_at DESC
        `;

        const [rows] = await dbConnection.query(query, [userId]);
        return rows;
    }

    // =========================
    // Analytics functionality
    // =========================
    async initializeAnalytics(collectionId) {
        if (!ENABLE_ANALYTICS) {
            return;
        }

        // Check if analytics already exists
        const [existing] = await dbConnection.query(
            'SELECT 1 FROM collection_analytics WHERE collection_id = ?',
            [collectionId]
        );

        if (existing.length === 0) {
            await dbConnection.query(
                'INSERT INTO collection_analytics (collection_id, view_count, bookmark_count, share_count) VALUES (?, 0, 0, 0)',
                [collectionId]
            );
        }
    }

    async recordCollectionView(collectionId, userId, ipAddress) {
        if (!ENABLE_ANALYTICS) {
            return;
        }

        try {
            // Record the view
            await dbConnection.query(
                'INSERT INTO collection_views (collection_id, user_id, ip_address) VALUES (?, ?, ?)',
                [collectionId, userId || null, ipAddress || null]
            );

            // Update view count in analytics
            await dbConnection.query(
                'UPDATE collection_analytics SET view_count = view_count + 1 WHERE collection_id = ?',
                [collectionId]
            );
        } catch (error) {
            console.error('Error recording collection view:', error);
            // Continue even if logging fails
        }
    }

    async getCollectionAnalytics(collectionId) {
        if (!ENABLE_ANALYTICS) {
            return { views: 0, bookmarks: 0, shares: 0 };
        }

        const [rows] = await dbConnection.query(
            'SELECT view_count as views, bookmark_count as bookmarks, share_count as shares FROM collection_analytics WHERE collection_id = ?',
            [collectionId]
        );

        if (rows.length === 0) {
            // Initialize analytics if they don't exist
            await this.initializeAnalytics(collectionId);
            return { views: 0, bookmarks: 0, shares: 0 };
        }

        return rows[0];
    }

    async getViewsOverTime(collectionId, days = 30) {
        if (!ENABLE_ANALYTICS) {
            return [];
        }

        const query = `
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM collection_views
            WHERE collection_id = ?
              AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at)
        `;

        const [rows] = await dbConnection.query(query, [collectionId, days]);
        return rows;
    }

    // =========================
    // Share functionality
    // =========================
    async generateShareToken(userId, collectionId) {
        if (!ENABLE_SHARING) {
            throw new Error("Sharing feature is disabled");
        }

        // Check if user can share this collection (must be owner or admin)
        const [collection] = await dbConnection.query(
            'SELECT user_id FROM collections WHERE id = ?',
            [collectionId]
        );

        if (collection.length === 0) {
            throw new Error("Collection not found");
        }

        if (collection[0].user_id !== userId) {
            // Check if user is admin
            const [admin] = await dbConnection.query(
                'SELECT 1 FROM users WHERE discord_id = ? AND is_admin = 1',
                [userId]
            );

            if (admin.length === 0) {
                throw new Error("You don't have permission to share this collection");
            }
        }

        // Generate a unique token
        const shareToken = uuidv4();
        const expiresAt = new Date(Date.now() + SHARE_TOKEN_EXPIRATION * 1000);

        // Store the share token
        await dbConnection.query(
            'INSERT INTO collection_shares (collection_id, user_id, share_token, expires_at) VALUES (?, ?, ?, ?)',
            [collectionId, userId, shareToken, expiresAt]
        );

        // Update share count in analytics
        if (ENABLE_ANALYTICS) {
            await dbConnection.query(
                'UPDATE collection_analytics SET share_count = share_count + 1 WHERE collection_id = ?',
                [collectionId]
            );
        }

        return {
            token: shareToken,
            expires: expiresAt
        };
    }
}

export default CollectionService;
