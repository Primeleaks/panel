import axios from 'axios';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import querystring from 'querystring';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3001/api/discord/callback";

class DiscordController {

    constructor(services) {
        this.userService = services.userService;
        this.blacklistService = services.blacklistService;
        this.discordService = services.discordService;
        if (!DISCORD_CLIENT_ID) console.warn("WARNUNG: DISCORD_CLIENT_ID fehlt oder ist leer!");
        if (!DISCORD_CLIENT_SECRET) console.warn("WARNUNG: DISCORD_CLIENT_SECRET fehlt oder ist leer!");
        if (!process.env.DISCORD_WEBHOOK_URL) console.warn("WARNUNG: DISCORD_LOGIN_WEBHOOK_URL fehlt oder ist leer!");
    }

    registerRoutes(app) {

        app.get("/api/discord/isAdmin/:discordId", (req, res) => {
            const { discordId } = req.params;
            this.discordService.hasAdminRole(discordId).then((isAdmin) => {
                res.json(isAdmin);
            })
        });

        app.get("/api/discord/callback", async (req, res) => {
            const code = req.query.code;
            if (!code) {
                return res.status(400).json({error: "Fehler: Kein OAuth2-Code übergeben."});
            }

            try {
                const tokenRequestBody = querystring.stringify({
                    client_id: DISCORD_CLIENT_ID,
                    client_secret: DISCORD_CLIENT_SECRET,
                    grant_type: "authorization_code",
                    scope: "identify guilds guilds.join",
                    code: code,
                    redirect_uri: REDIRECT_URI,
                });

                const tokenResponse = await axios.post(
                    "https://discord.com/api/oauth2/token",
                    tokenRequestBody,
                    {
                        headers: {"Content-Type": "application/x-www-form-urlencoded"},
                    }
                );


                const accessToken = tokenResponse.data.access_token;
                const discordUserResponse = await axios.get("https://discord.com/api/users/@me", {
                    headers: {Authorization: `Bearer ${accessToken}`},
                });


                const {id: discord_id, username: discordUsername, avatar: discordAvatar} = discordUserResponse.data;

                const blacklistStatus = await this.blacklistService.hasBlacklistEntry(discord_id);

                if(blacklistStatus) {
                    res.status(400).json({error: "You are blacklisted."});
                    return;
                }

                await this.discordService.addUserToGuild(discord_id, accessToken);

                const isAdmin = await this.discordService.hasAdminRole(discord_id);

                console.log("Admin: ", isAdmin ? "Ja" : "Nein")

                let apiToken = undefined;
                let user = await this.userService.findUserByDiscordId(discord_id);

                if (!user) {
                    if(isAdmin)
                        apiToken = crypto.randomBytes(32).toString('hex');
                    user = await this.userService.createUser(discord_id, discordUsername, discordAvatar, apiToken);
                } else {
                    if(isAdmin) {
                        apiToken = crypto.randomBytes(32).toString('hex');
                        user = await this.userService.updateApiToken(discord_id, apiToken);
                    }
                }

                const avatarUrl = discordAvatar
                    ? `https://cdn.discordapp.com/avatars/${discord_id}/${discordAvatar}.png`
                    : 'https://cdn.discordapp.com/embed/avatars/0.png';


                const token = jwt.sign(
                    {
                        discord_id: discord_id,
                        username: discordUsername,
                        isAdmin: isAdmin,
                        avatar: avatarUrl,
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: "24h" }
                );

                const refreshToken = jwt.sign(
                    {
                        discord_id: discord_id,
                        username: discordUsername,
                        avatar: avatarUrl,
                        isAdmin: isAdmin,
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: "7d" }
                );

                res.cookie("token", token, {
                    httpOnly: false,
                    sameSite: "lax",
                    path: "/",
                    maxAge: 3600000,
                    secure: false,
                });

                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    secure: false,
                    sameSite: "lax",
                });


                await this.sendLoginWebhook({
                    discord_id: discord_id,
                    username: discordUsername,
                    avatar: discordAvatar
                });

                let redirectUrl = `http://localhost:5173/?avatar=${avatarUrl}`; //frontend
                res.redirect(redirectUrl);

            } catch (error) {
                console.error("Fehler bei der Token-Anfrage:", {
                    status: error.response ? error.response.status : 'Kein Status verfügbar',
                    statusText: error.response ? error.response.statusText : 'Kein Status-Text verfügbar',
                    data: error.response && error.response.data ? error.response.data : 'Keine zusätzlichen Daten verfügbar',
                    message: error.message,
                    stack: error.stack
                });

                return res.status(500).json({
                    error: "Fehler bei der Authentifizierung mit Discord.",
                    details: error.message
                });
            }
        });
    }

    async sendLoginWebhook(user) {
        try {
            const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

            if (!webhookUrl) {
                return;
            }

            const isAdmin = await this.discordService.hasAdminRole(user.discord_id);
            const isBlacklisted = await this.blacklistService.hasBlacklistEntry(user.discord_id);

            const now = new Date();
            const timestamp = now.toISOString();
            const formattedDate = now.toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            const formattedTime = now.toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            const avatarUrl = user.avatar
                ? `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar}.png`
                : 'https://cdn.discordapp.com/embed/avatars/0.png';
            const embed = {
                username: "localhost:3001 Panel",
                icon_url: "https://cdn.discordapp.com/embed/avatars/0.png",
                color: 16711680,
                title: "localhost:3001 Panel Login",
                thumbnail: {
                    url: avatarUrl
                },
                fields: [
                    {
                        name: "Benutzername",
                        value: user.username || "Unbekannt",
                        inline: false
                    },
                    {
                        name: "Discord ID",
                        value: user.discord_id || "Unbekannt",
                        inline: false
                    },
                    {
                        name: "Datum & Zeit",
                        value: `${formattedDate} um ${formattedTime}`,
                        inline: false
                    },
                    {
                        name: "Blacklist?",
                        value: isBlacklisted ? "Ja" : "Nein",
                        inline: true
                    },
                    {
                        name: "Panel Admin?",
                        value: isAdmin ? "Ja" : "Nein",
                        inline: true
                    }
                ],
                footer: {
                    text: "localhost:3001 Panel"
                },
                timestamp: timestamp
            };
            const payload = {
                embeds: [embed]
            };
            await axios.post(webhookUrl, payload, {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error("Fehler beim Senden des Login-Webhooks:", error.message);
        }
    }
}

export default DiscordController;