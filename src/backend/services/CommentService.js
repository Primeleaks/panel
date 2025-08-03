import dbConnection from "../database.js";

class CommentService {
    async createComment(scriptId, userId, content, parentId = null) {
        const query = `
            INSERT INTO comments (script_id, user_id, content, parent_id)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await dbConnection.query(query, [scriptId, userId, content, parentId]);
        return result.insertId;
    }

    async getComments(scriptId, limit = 50) {
        const query = `
            SELECT c.*, u.username, u.avatar,
                   (SELECT COUNT(*) FROM comments WHERE parent_id = c.id AND is_deleted = 0) as reply_count
            FROM comments c
            JOIN users u ON c.user_id = u.discord_id
            WHERE c.script_id = ? AND c.is_deleted = 0 AND c.parent_id IS NULL
            ORDER BY c.created_at DESC
            LIMIT ?
        `;
        const [rows] = await dbConnection.query(query, [scriptId, limit]);
        
        // Get replies for each comment
        for (let comment of rows) {
            comment.replies = await this.getReplies(comment.id);
        }
        
        return rows;
    }

    async getReplies(parentId, limit = 10) {
        const query = `
            SELECT c.*, u.username, u.avatar
            FROM comments c
            JOIN users u ON c.user_id = u.discord_id
            WHERE c.parent_id = ? AND c.is_deleted = 0
            ORDER BY c.created_at ASC
            LIMIT ?
        `;
        const [rows] = await dbConnection.query(query, [parentId, limit]);
        return rows;
    }

    async updateComment(commentId, userId, content) {
        const query = `
            UPDATE comments 
            SET content = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ? AND is_deleted = 0
        `;
        const [result] = await dbConnection.query(query, [content, commentId, userId]);
        return result.affectedRows > 0;
    }

    async deleteComment(commentId, userId, isAdmin = false) {
        const whereClause = isAdmin ? "id = ?" : "id = ? AND user_id = ?";
        const params = isAdmin ? [commentId] : [commentId, userId];
        
        const query = `UPDATE comments SET is_deleted = 1 WHERE ${whereClause}`;
        const [result] = await dbConnection.query(query, params);
        return result.affectedRows > 0;
    }

    async getComment(commentId) {
        const query = `
            SELECT c.*, u.username, u.avatar
            FROM comments c
            JOIN users u ON c.user_id = u.discord_id
            WHERE c.id = ?
        `;
        const [rows] = await dbConnection.query(query, [commentId]);
        return rows[0] || null;
    }

    async getUserComments(userId, limit = 20) {
        const query = `
            SELECT c.*, s.title, s.imgurLink
            FROM comments c
            JOIN scripts s ON c.script_id = s.id
            WHERE c.user_id = ? AND c.is_deleted = 0 AND s.isDeleted = 0
            ORDER BY c.created_at DESC
            LIMIT ?
        `;
        const [rows] = await dbConnection.query(query, [userId, limit]);
        return rows;
    }

    async getCommentCount(scriptId) {
        const query = `
            SELECT COUNT(*) as count
            FROM comments
            WHERE script_id = ? AND is_deleted = 0
        `;
        const [rows] = await dbConnection.query(query, [scriptId]);
        return rows[0].count;
    }
}

export default CommentService;
