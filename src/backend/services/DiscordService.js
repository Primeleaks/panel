import axios from "axios";
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = "https://discord.com/api/v10";
const botToken = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;
const adminRoleId = process.env.DISCORD_ADMIN_ROLE_ID;


class DiscordService {

    async hasAdminRole(userId) {
        if (!userId) return false;
        try {
            const allMembers = await axios.get(
                `${API_BASE_URL}/guilds/${guildId}/members`,
                {
                    headers: {
                        Authorization: `Bot ${botToken}`,
                    },
                    params: {
                        limit: 1000,
                    },
                }
            );

            const data = allMembers.data;
            const userRoles = data
                .filter(member => member.user.id === userId)
                .map(member => member.roles);

            if (userRoles.length === 0 || !userRoles[0]) {
                return false;
            }

            return userRoles[0].includes(adminRoleId);
        } catch (error) {
            console.error("Fehler beim Überprüfen der Admin-Rolle:", error);
            return false;
        }
    }

    async addUserToGuild(userId, accessToken) {
        try {
            const response = await axios.put(
                `${API_BASE_URL}/guilds/${guildId}/members/${userId}`,
                {
                    access_token: accessToken
                },
                {
                    headers: {
                        Authorization: `Bot ${botToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return true;
        } catch (error) {
            console.error("Fehler beim Hinzufügen des Benutzers zum Server:", error.message);
            return false;
        }
    }

}
export default DiscordService;