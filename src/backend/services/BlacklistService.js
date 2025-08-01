import dbConnection from "../database.js";

class BlacklistService {

    async createBlacklistEntry(discord_id, username, reason, bannedBy) {
        const existingEntry = await this.findBlacklistEntry(discord_id);

        if (existingEntry) {
            const updateQuery = "UPDATE blacklist SET username = ?, reason = ?, bannedBy = ? WHERE discord_id = ?";
            await dbConnection.query(updateQuery, [username, reason, bannedBy, discord_id]);
            return await this.findBlacklistEntry(discord_id);
        } else {
            const query = "INSERT INTO blacklist (discord_id, username, reason, date, bannedBy) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)";
            const params = [discord_id, username, reason, bannedBy];
            await dbConnection.query(query, params);
            return await this.findBlacklistEntry(discord_id);
        }

    }

    async findBlacklistEntry(discord_id) {
        const [rows] = await dbConnection.query("SELECT * FROM blacklist WHERE discord_id = ?", [discord_id]);
        return rows[0] || null;
    }

    async deleteBlacklistEntry(discord_id) {
        await dbConnection.query("DELETE FROM blacklist WHERE discord_id = ?", [discord_id]);
    }

    async getAllBlacklistEntries() {
        const [rows] = await dbConnection.query("SELECT * FROM blacklist");
        return rows;
    }

    async hasBlacklistEntry(discord_id) {
        const [rows] = await dbConnection.query("SELECT * FROM blacklist WHERE discord_id = ?", [discord_id]);
        return rows.length > 0;
    }

}

export default BlacklistService;