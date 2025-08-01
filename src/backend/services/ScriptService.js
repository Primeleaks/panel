import dbConnection from "../database.js";

class ScriptService {

    async createScript(title, description, category, image, downloadUrl, authorId, author, isDeleted) {
        const query = `
            INSERT INTO scripts (
                title,
                description,
                category,
                image,
                downloadUrl,
                authorId,
                author,
                isDeleted,
                isPending,
                isApproved
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [
            title,
            description,
            category,
            image,
            downloadUrl,
            authorId,
            author,
            isDeleted,
            false,
            true
        ];
        await dbConnection.query(query, params);
    }

    async getScriptsByCategory(category) {
        const [rows] = await dbConnection.query(
            "SELECT * FROM scripts WHERE category = ? AND isPending = FALSE AND isApproved = TRUE",
            [category]
        );
        return rows;
    }

    async getScriptById(id) {
        const [rows] = await dbConnection.query("SELECT * FROM scripts WHERE id = ?", [id]);
        return rows[0] || null;
    }

    async getScriptsByAuthor(authorId) {
        const [rows] = await dbConnection.query(
            "SELECT * FROM scripts WHERE authorId = ?",
            [authorId]
        );
        return rows;
    }

    async getScripts() {
        const [rows] = await dbConnection.query(
            "SELECT * FROM scripts WHERE isPending = FALSE AND isApproved = TRUE"
        );
        return rows;
    }

    async getPendingScripts() {
        const [rows] = await dbConnection.query(
            "SELECT * FROM scripts WHERE isPending = TRUE AND isApproved = FALSE"
        );
        return rows;
    }

    async getAllScriptsForAdmin() {
        const [rows] = await dbConnection.query("SELECT * FROM scripts");
        return rows;
    }

    async deleteScript(id) {
        await dbConnection.query("DELETE FROM scripts WHERE id = ?", [id]);
    }

    async createPendingScript(title, description, category, imgurLink, downloadLink, authorId, author) {
        const [result] = await dbConnection.query(
            "INSERT INTO scripts (title, description, category, image, downloadUrl, authorId, author, isPending, isApproved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [title, description, category, imgurLink, downloadLink, authorId, author, true, false]
        );
        return result.insertId;
    }

    async approveScript(scriptId) {
        await dbConnection.query(
            "UPDATE scripts SET isPending = ?, isApproved = ? WHERE id = ?",
            [false, true, scriptId]
        );

        const [rows] = await dbConnection.query("SELECT * FROM scripts WHERE id = ?", [scriptId]);
        return rows[0] || null;
    }


    async rejectScript(scriptId) {
        await dbConnection.query("DELETE FROM scripts WHERE id = ?", [scriptId]);
    }
}

export default ScriptService;