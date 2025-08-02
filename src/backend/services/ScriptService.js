import dbConnection from "../database.js";

class ScriptService {
    async createScript(scriptData) {
        const { title, description, category, downloadLink, imgurLink, authorId, author, tags = [], version = '1.0.0' } = scriptData;
        const query = `
            INSERT INTO scripts (title, description, category, downloadUrl, image, authorId, author, version, isPending, isApproved)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
        `;
        const [result] = await dbConnection.query(query, [title, description, category, downloadLink, imgurLink, authorId, author, version]);
        
        const scriptId = result.insertId;
        
        // Add tags if provided
        if (tags.length > 0) {
            await this.addScriptTags(scriptId, tags);
        }
        
        return scriptId;
    }

    async updateScript(scriptId, userId, scriptData, isAdmin = false) {
        const { title, description, category, downloadLink, imgurLink, version, tags = [] } = scriptData;
        
        // Check if user owns the script or is admin
        if (!isAdmin) {
            const script = await this.getScriptById(scriptId);
            if (!script || script.authorId !== userId) {
                throw new Error("Unauthorized");
            }
        }
        
        const query = `
            UPDATE scripts 
            SET title = ?, description = ?, category = ?, downloadUrl = ?, image = ?, version = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        const [result] = await dbConnection.query(query, [title, description, category, downloadLink, imgurLink, version, scriptId]);
        
        if (result.affectedRows > 0) {
            // Update tags
            await this.updateScriptTags(scriptId, tags);
        }
        
        return result.affectedRows > 0;
    }

    async getScripts(category = null, search = null, sortBy = 'date', sortOrder = 'DESC', limit = 20, offset = 0, tags = []) {
        let whereClause = "WHERE isDeleted = 0 AND isApproved = 1";
        const params = [];

        if (category && category !== 'all') {
            whereClause += " AND category = ?";
            params.push(category);
        }

        if (search) {
            whereClause += " AND (title LIKE ? OR description LIKE ? OR author LIKE ?)";
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (tags.length > 0) {
            const tagPlaceholders = tags.map(() => '?').join(',');
            whereClause += ` AND id IN (SELECT script_id FROM script_tags WHERE tag IN (${tagPlaceholders}))`;
            params.push(...tags);
        }

        const allowedSorts = ['date', 'title', 'downloads', 'views', 'rating_average', 'updated_at'];
        const allowedOrders = ['ASC', 'DESC'];
        const validSort = allowedSorts.includes(sortBy) ? sortBy : 'date';
        const validOrder = allowedOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

        params.push(limit, offset);

        const query = `
            SELECT s.*, 
                   (SELECT GROUP_CONCAT(tag) FROM script_tags WHERE script_id = s.id) as tags
            FROM scripts s
            ${whereClause}
            ORDER BY ${validSort} ${validOrder}
            LIMIT ? OFFSET ?
        `;

        const [rows] = await dbConnection.query(query, params);
        
        return rows.map(script => ({
            ...script,
            tags: script.tags ? script.tags.split(',') : []
        }));
    }

    async getScriptById(id) {
        const query = `
            SELECT s.*, 
                   (SELECT GROUP_CONCAT(tag) FROM script_tags WHERE script_id = s.id) as tags
            FROM scripts s 
            WHERE s.id = ?
        `;
        const [rows] = await dbConnection.query(query, [id]);
        const script = rows[0];
        
        if (script) {
            script.tags = script.tags ? script.tags.split(',') : [];
        }
        
        return script || null;
    }

    async incrementViews(scriptId) {
        const query = "UPDATE scripts SET views = views + 1 WHERE id = ?";
        await dbConnection.query(query, [scriptId]);
    }

    async incrementDownloads(scriptId) {
        const query = "UPDATE scripts SET downloads = downloads + 1 WHERE id = ?";
        await dbConnection.query(query, [scriptId]);
    }

    async getTrendingScripts(days = 7, limit = 10) {
        const query = `
            SELECT s.*, 
                   (SELECT GROUP_CONCAT(tag) FROM script_tags WHERE script_id = s.id) as tags,
                   (s.downloads * 0.4 + s.views * 0.2 + s.rating_average * s.rating_count * 0.4) as trending_score
            FROM scripts s
            WHERE s.isDeleted = 0 AND s.isApproved = 1 
            AND s.date >= DATE_SUB(NOW(), INTERVAL ? DAY)
            ORDER BY trending_score DESC
            LIMIT ?
        `;
        const [rows] = await dbConnection.query(query, [days, limit]);
        
        return rows.map(script => ({
            ...script,
            tags: script.tags ? script.tags.split(',') : []
        }));
    }

    async getRecentlyUpdated(limit = 10) {
        const query = `
            SELECT s.*, 
                   (SELECT GROUP_CONCAT(tag) FROM script_tags WHERE script_id = s.id) as tags
            FROM scripts s
            WHERE s.isDeleted = 0 AND s.isApproved = 1 AND s.updated_at IS NOT NULL
            ORDER BY s.updated_at DESC
            LIMIT ?
        `;
        const [rows] = await dbConnection.query(query, [limit]);
        
        return rows.map(script => ({
            ...script,
            tags: script.tags ? script.tags.split(',') : []
        }));
    }

    async getUserScripts(userId, includeDeleted = false, includePending = false) {
        let whereClause = "WHERE authorId = ?";
        
        if (!includeDeleted) {
            whereClause += " AND isDeleted = 0";
        }
        
        if (!includePending) {
            whereClause += " AND isPending = 0";
        }

        const query = `
            SELECT s.*, 
                   (SELECT GROUP_CONCAT(tag) FROM script_tags WHERE script_id = s.id) as tags
            FROM scripts s
            ${whereClause}
            ORDER BY s.date DESC
        `;
        const [rows] = await dbConnection.query(query, [userId]);
        
        return rows.map(script => ({
            ...script,
            tags: script.tags ? script.tags.split(',') : []
        }));
    }

    // Tag management
    async addScriptTags(scriptId, tags) {
        if (!tags.length) return;
        
        const values = tags.map(() => "(?, ?)").join(", ");
        const params = [];
        
        tags.forEach(tag => {
            params.push(scriptId, tag.toLowerCase().trim());
        });
        
        const query = `INSERT IGNORE INTO script_tags (script_id, tag) VALUES ${values}`;
        await dbConnection.query(query, params);
    }

    async updateScriptTags(scriptId, tags) {
        // Remove existing tags
        await dbConnection.query("DELETE FROM script_tags WHERE script_id = ?", [scriptId]);
        
        // Add new tags
        if (tags.length > 0) {
            await this.addScriptTags(scriptId, tags);
        }
    }

    async getPopularTags(limit = 20) {
        const query = `
            SELECT tag, COUNT(*) as count
            FROM script_tags st
            JOIN scripts s ON st.script_id = s.id
            WHERE s.isDeleted = 0 AND s.isApproved = 1
            GROUP BY tag
            ORDER BY count DESC
            LIMIT ?
        `;
        const [rows] = await dbConnection.query(query, [limit]);
        return rows;
    }

    async searchScriptsByTag(tag) {
        const query = `
            SELECT s.*, 
                   (SELECT GROUP_CONCAT(tag) FROM script_tags WHERE script_id = s.id) as tags
            FROM scripts s
            JOIN script_tags st ON s.id = st.script_id
            WHERE st.tag = ? AND s.isDeleted = 0 AND s.isApproved = 1
            ORDER BY s.date DESC
        `;
        const [rows] = await dbConnection.query(query, [tag]);
        
        return rows.map(script => ({
            ...script,
            tags: script.tags ? script.tags.split(',') : []
        }));
    }

    // Legacy methods (updated to work with new schema)
    async getScriptsByCategory(category) {
        return await this.getScripts(category);
    }

    async getScriptsByAuthor(authorId) {
        return await this.getUserScripts(authorId);
    }

    async getAllScriptsForAdmin() {
        const query = `
            SELECT s.*, 
                   (SELECT GROUP_CONCAT(tag) FROM script_tags WHERE script_id = s.id) as tags
            FROM scripts s
            ORDER BY s.date DESC
        `;
        const [rows] = await dbConnection.query(query);
        
        return rows.map(script => ({
            ...script,
            tags: script.tags ? script.tags.split(',') : []
        }));
    }

    async getPendingScripts() {
        const query = `
            SELECT s.*, 
                   (SELECT GROUP_CONCAT(tag) FROM script_tags WHERE script_id = s.id) as tags
            FROM scripts s
            WHERE s.isPending = 1 AND s.isDeleted = 0
            ORDER BY s.date ASC
        `;
        const [rows] = await dbConnection.query(query);
        
        return rows.map(script => ({
            ...script,
            tags: script.tags ? script.tags.split(',') : []
        }));
    }

    async createPendingScript(title, description, category, imgurLink, downloadLink, authorId, author, tags = []) {
        const scriptData = {
            title,
            description,
            category,
            downloadLink,
            imgurLink,
            authorId,
            author,
            tags
        };
        return await this.createScript(scriptData);
    }

    async approveScript(scriptId) {
        const query = "UPDATE scripts SET isPending = 0, isApproved = 1 WHERE id = ?";
        const [result] = await dbConnection.query(query, [scriptId]);
        return result.affectedRows > 0;
    }

    async rejectScript(scriptId, reason = null) {
        const query = "UPDATE scripts SET isPending = 0, isApproved = 0, isDeleted = 1, deletedAt = CURRENT_TIMESTAMP WHERE id = ?";
        const [result] = await dbConnection.query(query, [scriptId]);
        return result.affectedRows > 0;
    }

    async deleteScript(scriptId, deletedBy = null) {
        if (deletedBy) {
            const query = "UPDATE scripts SET isDeleted = 1, deletedAt = CURRENT_TIMESTAMP, deletedBy = ? WHERE id = ?";
            await dbConnection.query(query, [deletedBy, scriptId]);
        } else {
            // Hard delete for compatibility
            await dbConnection.query("DELETE FROM scripts WHERE id = ?", [scriptId]);
        }
    }

    async restoreScript(scriptId) {
        const query = "UPDATE scripts SET isDeleted = 0, deletedAt = NULL, deletedBy = NULL WHERE id = ?";
        const [result] = await dbConnection.query(query, [scriptId]);
        return result.affectedRows > 0;
    }

    // Statistics
    async getScriptCount(category = null) {
        let query = "SELECT COUNT(*) as count FROM scripts WHERE isDeleted = 0 AND isApproved = 1";
        const params = [];
        
        if (category && category !== 'all') {
            query += " AND category = ?";
            params.push(category);
        }
        
        const [rows] = await dbConnection.query(query, params);
        return rows[0].count;
    }

    async getTopScripts(sortBy = 'downloads', limit = 10) {
        const allowedSorts = ['downloads', 'views', 'rating_average'];
        const validSort = allowedSorts.includes(sortBy) ? sortBy : 'downloads';
        
        const query = `
            SELECT s.*, 
                   (SELECT GROUP_CONCAT(tag) FROM script_tags WHERE script_id = s.id) as tags
            FROM scripts s
            WHERE s.isDeleted = 0 AND s.isApproved = 1
            ORDER BY ${validSort} DESC
            LIMIT ?
        `;
        const [rows] = await dbConnection.query(query, [limit]);
        
        return rows.map(script => ({
            ...script,
            tags: script.tags ? script.tags.split(',') : []
        }));
    }
}

export default ScriptService;