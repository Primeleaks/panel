import dbConnection from "../database.js";

class UserService {
    async createUser(discord_id, username, avatar, apiToken) {
        const query = "INSERT INTO users (discord_id, username, avatar, api_token, created) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)";
        const params = [discord_id, username, avatar, apiToken];

        await dbConnection.query(query, params);
        return await this.findUserByDiscordId(discord_id);
    }

    async findUserByDiscordId(discord_id) {
        try {
            const [rows] = await dbConnection.query("SELECT * FROM users WHERE discord_id = ?", [discord_id]);
            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    async findUserByApiToken(apiToken) {
        try {
            const [rows] = await dbConnection.query("SELECT * FROM users WHERE api_token = ?", [apiToken]);
            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    async updateApiToken(discord_id, apiToken) {
        const query = "UPDATE users SET api_token = ? WHERE discord_id = ?";
        const params = [apiToken, discord_id];
        await dbConnection.query(query, params);
        return await this.findUserByDiscordId(discord_id);
    }

    async verifyApiToken(apiToken) {
        const user = await this.findUserByApiToken(apiToken);
        return user != null;
    }

}

export default UserService;