import axios from "axios";
import jwt from "jsonwebtoken";

class BlacklistController {

    constructor(services) {
        this.blacklistService = services.blacklistService;
        this.userService = services.userService;
        if (!process.env.DISCORD_BLACKLIST_WEBHOOK_URL) console.warn("WARNUNG: DISCORD_BLACKLIST_WEBHOOK_URL fehlt oder ist leer!");
    }

    authenticateJWT(req, res, next) {
        const authHeader = req.headers.authorization;
        let token;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(403).json({ message: "Access Token fehlt oder ungültig!" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (err) {
            console.error("Fehler bei der JWT-Überprüfung:", err.message);
            return res.status(403).json({ message: "Access Token ungültig oder abgelaufen!" });
        }
    }

    authorize() {
        return (req, res, next) => {
            if(!req.user) {
                res.status(400).json({message: "Unauthorised"});
                return;
            }
            if(!req.user.isAdmin) {
                res.status(400).json({message: "Unauthorised"});
                return;
            }

            next();
        };
    }



    registerRoutes(app) {

        app.use((req, res, next) => {
            console.log(`Route Requested: ${req.method} ${req.originalUrl}`);
            next();
        });

        app.get("/api/blacklist/", this.authenticateJWT.bind(this), this.authorize(), async (req, res) => {
            await this.blacklistService.getAllBlacklistEntries()
                .then((entries) => {
                    res.json(entries);
                });
        });

        app.get("/api/blacklist/user/:discordId",this.authenticateJWT.bind(this), this.authorize(), async (req, res) => {
            const discordId = req.params.discordId;
            await this.blacklistService.findBlacklistEntry(discordId)
                .then((entry) => {
                    if(entry.length === 0)
                        return {error: "Error: No Blacklist Entry found"};

                    res.json(entry);
                });
        });

        app.get("/api/blacklist/isBlacklisted/:discordId", async (req, res) => {
            const discordId = req.params.discordId;
            this.blacklistService.hasBlacklistEntry(discordId)
                .then((status) => {
                    res.json(status);
                });
        });

        app.delete("/api/blacklist/delete/:discordId", this.authenticateJWT.bind(this), this.authorize(), async (req, res) => {
            const discordId = req.params.discordId;
            try {
                await this.blacklistService.deleteBlacklistEntry(discordId);
                res.json({ success: true, message: "Benutzer erfolgreich von der Blacklist entfernt" });
            } catch (error) {
                console.error("Fehler beim Entfernen des Benutzers von der Blacklist:", error);
                res.status(500).json({ success: false, message: "Fehler beim Entfernen von der Blacklist" });
            }
            await this.UnBlacklist({
                discordId: discordId
            });
        });

        app.post("/api/blacklist/create", this.authenticateJWT.bind(this), this.authorize(), async (req, res) => {
            const {discordId, name: username, reason, bannedBy} = req.body;
            await this.blacklistService.createBlacklistEntry(discordId, username, reason, bannedBy)
                .then((entry) => {
                    res.json(entry);
                });
            await this.sendLoginWebhook({
                discordId: discordId,
                reason: reason,
                bannedBy: bannedBy
            });
        });

    }

    async sendLoginWebhook(user) {
        try {
            const webhookUrl = process.env.DISCORD_BLACKLIST_WEBHOOK_URL;

            if (!webhookUrl) {
                return;
            }
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
                username: "Hopeleaks Panel",
                icon_url: "https://cdn.discordapp.com/embed/avatars/0.png",
                color: 16711680,
                title: "Hopeleaks Panel Blacklist",
                thumbnail: {
                    url: avatarUrl
                },
                fields: [
                    {
                        name: "Discord ID",
                        value: user.discordId || "Unbekannt",
                        inline: false
                    },
                    {
                        name: "Reason",
                        value: user.reason || "Keine Angegeben",
                        inline: false
                    },
                    {
                        name: "by",
                        value: user.bannedBy || "Unbekannt",
                        inline: false
                    },
                ],
                footer: {
                    text: `Hopeleaks Panel Blacklist`
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
    async UnBlacklist(user) {
        try {
            const webhookUrl = process.env.DISCORD_BLACKLIST_WEBHOOK_URL;

            if (!webhookUrl) {
                return;
            }
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
                username: "Hopeleaks Panel",
                icon_url: "https://cdn.discordapp.com/embed/avatars/0.png",
                color: 16711680,
                title: "Hopeleaks Panel Remove Blacklist",
                thumbnail: {
                    url: avatarUrl
                },
                fields: [
                    {
                        name: "Discord ID",
                        value: user.discordId || "Unbekannt",
                        inline: false
                    },
                ],
                footer: {
                    text: `Hopeleaks Panel Blacklist`
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
export default BlacklistController;