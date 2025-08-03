import dbConnection from "../database.js";

class RatingService {
    async createRating(scriptId, userId, rating, review = null) {
        const query = `
            INSERT INTO ratings (script_id, user_id, rating, review)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE rating = VALUES(rating), review = VALUES(review), updated_at = CURRENT_TIMESTAMP
        `;
        const [result] = await dbConnection.query(query, [scriptId, userId, rating, review]);
        
        // Update script's average rating
        await this.updateScriptRating(scriptId);
        
        return result;
    }

    async updateScriptRating(scriptId) {
        const query = `
            UPDATE scripts 
            SET rating_average = (
                SELECT COALESCE(AVG(rating), 0) FROM ratings WHERE script_id = ?
            ),
            rating_count = (
                SELECT COUNT(*) FROM ratings WHERE script_id = ?
            )
            WHERE id = ?
        `;
        await dbConnection.query(query, [scriptId, scriptId, scriptId]);
    }

    async getRating(scriptId, userId) {
        const query = "SELECT * FROM ratings WHERE script_id = ? AND user_id = ?";
        const [rows] = await dbConnection.query(query, [scriptId, userId]);
        return rows[0] || null;
    }

    async getScriptRatings(scriptId, limit = 10, offset = 0) {
        const query = `
            SELECT r.*, u.username, u.avatar
            FROM ratings r
            JOIN users u ON r.user_id = u.discord_id
            WHERE r.script_id = ? AND r.review IS NOT NULL AND r.review != ''
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await dbConnection.query(query, [scriptId, limit, offset]);
        return rows;
    }

    async deleteRating(scriptId, userId) {
        const query = "DELETE FROM ratings WHERE script_id = ? AND user_id = ?";
        const [result] = await dbConnection.query(query, [scriptId, userId]);
        
        if (result.affectedRows > 0) {
            await this.updateScriptRating(scriptId);
        }
        
        return result.affectedRows > 0;
    }

    async getUserRatings(userId, limit = 20) {
        const query = `
            SELECT r.*, s.title, s.imgurLink
            FROM ratings r
            JOIN scripts s ON r.script_id = s.id
            WHERE r.user_id = ? AND s.isDeleted = 0
            ORDER BY r.created_at DESC
            LIMIT ?
        `;
        const [rows] = await dbConnection.query(query, [userId, limit]);
        return rows;
    }
}

export default RatingService;
