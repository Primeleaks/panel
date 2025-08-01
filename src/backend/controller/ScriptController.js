import axios from "axios";
import jwt from 'jsonwebtoken';

class ScriptController {
    constructor(services, discordClient) {
        this.scriptService = services.scriptService;
        this.userService = services.userService;
        this.discordClient = discordClient;

        if (!process.env.DISCORD_LEAK_WEBHOOK_URL) console.warn("WARNUNG: DISCORD_LEAK_WEBHOOK_URL fehlt oder ist leer!");

        this.lockrApiUrl = 'https://lockr.so/api/v1/lockers';
        this.lockrApiKey = 'e5bc936f13e76c649fe9ce33c4e47917a336ff4a39';
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
            return res.status(403).json({ message: "Nicht eingeloggt. Bitte neu anmelden." });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (err) {
            return res.status(403).json({ message: "Nicht eingeloggt. Bitte neu anmelden." });
        }
    }

    authorize() {
        return (req, res, next) => {
            if (!req.user || !req.user.isAdmin) {
                res.status(400).json({ message: "Unauthorised" });
                return;
            }
            next();
        };
    }

    async sendLoginWebhook(scriptData) {
        if (!process.env.DISCORD_LEAK_WEBHOOK_URL) return;

        const now = new Date();
        const timestamp = now.toISOString();
        const formattedDate = now.toLocaleDateString('de-DE', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        const formattedTime = now.toLocaleTimeString('de-DE', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        try {
            await axios.post(process.env.DISCORD_LEAK_WEBHOOK_URL, {
                embeds: [{
                    title: `Hopeleaks Leak Announce`,
                    color: 16711680,
                    fields: [
                        { name: "Titel", value: scriptData.title, inline: false },
                        { name: "Kategorie", value: scriptData.category, inline: false },
                        { name: "Datum & Zeit", value: `${formattedDate} um ${formattedTime}`, inline: false },
                        { name: "Author", value: scriptData.author, inline: false }
                    ],
                    image: { url: scriptData.image }
                }],
                footer: { text: "Hopeleaks Panel" },
                timestamp: timestamp
            });
        } catch (error) {
            console.error("Fehler beim Senden des Login-Webhooks:", error);
        }
    }

    async sendApprovalWebhook(scriptData) {
        if (!this.discordClient) {
            console.error("Discord-Client nicht verf�gbar. Kann Genehmigungsanfrage nicht senden.");
            return;
        }
        try {
            await this.discordClient.sendApprovalRequest(scriptData);
        } catch (error) {
            console.error("Fehler beim Senden der Genehmigungsanfrage:", error);
        }
    }

    async createLocker({ title, target }) {
        try {
            const response = await axios.post(
                this.lockrApiUrl,
                { title, target },
                {
                    headers: {
                        'Authorization': `Bearer ${this.lockrApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Fehler beim Erstellen des Lockers:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    getLockrLink(lockerResult) {
        if (!lockerResult || !lockerResult.data) return null;
        console.log("LockerResult:", lockerResult);
        return lockerResult.data.url || null;
    }

    registerRoutes(app) {
        app.use((req, res, next) => { next(); });

        app.get("/api/scripts/", async (req, res) => {
            try {
                const scripts = await this.scriptService.getScripts();
                res.json(scripts);
            } catch (error) {
                res.status(500).json({ message: "Interner Serverfehler" });
            }
        });

        app.get("/api/admin/scripts/", this.authenticateJWT.bind(this), this.authorize(), async (req, res) => {
            try {
                const scripts = await this.scriptService.getAllScriptsForAdmin();
                res.json(scripts);
            } catch (error) {
                res.status(500).json({ message: "Interner Serverfehler" });
            }
        });

        app.get("/api/admin/scripts/pending", this.authenticateJWT.bind(this), this.authorize(), async (req, res) => {
            try {
                const scripts = await this.scriptService.getPendingScripts();
                res.json(scripts);
            } catch (error) {
                res.status(500).json({ message: "Interner Serverfehler" });
            }
        });

        app.post("/api/scripts/delete/:scriptId", this.authenticateJWT.bind(this), this.authorize(), async (req, res) => {
            try {
                await this.scriptService.deleteScript(req.params.scriptId);
                return res.status(200).json("Script deleted");
            } catch (error) {
                res.status(500).json({ message: "Fehler beim L�schen des Skripts" });
            }
        });

        app.get("/api/scripts/category/:category", async (req, res) => {
            try {
                const scripts = await this.scriptService.getScriptsByCategory(req.params.category);
                res.json(scripts);
            } catch (error) {
                res.status(500).json({ message: "Interner Serverfehler" });
            }
        });

        app.post("/api/scripts/create", this.authenticateJWT.bind(this), this.authorize(), async (req, res) => {
            try {
                const { title, description, category, imgurLink, downloadLink, authorId, author } = req.body.data;
                let lockrUrl = null;
                try {
                    const lockerResult = await this.createLocker({ title, target: downloadLink });
                    lockrUrl = this.getLockrLink(lockerResult);
                } catch (lockerError) {
                    console.error("Locker konnte nicht erstellt werden:", lockerError.message);
                }

                const effectiveDownloadLink = lockrUrl || downloadLink;

                await this.scriptService.createScript(
                    title, description, category, imgurLink, effectiveDownloadLink, authorId, author, false
                );

                res.json({ success: true });

                await this.sendLoginWebhook({
                    title: title,
                    description: description,
                    category: category,
                    author: author,
                    image: imgurLink
                });
            } catch (error) {
                res.status(500).json({ message: "Interner Serverfehler" });
            }
        });

        app.post("/api/scripts/createuserscript", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const { title, description, category, imgurLink, downloadLink, authorId, author } = req.body.data;

                let lockrUrl = null;
                try {
                    const lockerResult = await this.createLocker({ title, target: downloadLink });
                    lockrUrl = this.getLockrLink(lockerResult);
                } catch (lockerError) {
                    console.error("Locker f�r Userscript konnte nicht erstellt werden:", lockerError.message);
                }

                const effectiveDownloadLink = lockrUrl || downloadLink;

                const scriptId = await this.scriptService.createPendingScript(
                    title, description, category, imgurLink, effectiveDownloadLink, authorId, author
                );

                res.json({ success: true, message: "Dein Leak wurde erstellt und wartet auf Genehmigung durch einen Administrator." });

                await this.sendApprovalWebhook({
                    scriptId: scriptId,
                    title: title,
                    description: description,
                    category: category,
                    downloadLink: effectiveDownloadLink,
                    author: author,
                    image: imgurLink
                });
            } catch (error) {
                res.status(500).json({ message: "Interner Serverfehler" });
            }
        });

        app.post("/api/admin/scripts/approve/:scriptId", this.authenticateJWT.bind(this), this.authorize(), async (req, res) => {
            try {
                await this.scriptService.approveScript(req.params.scriptId);

                const script = await this.scriptService.getScriptById(req.params.scriptId);
                if (script) {
                    await this.sendLoginWebhook({
                        title: script.title,
                        description: script.description,
                        category: script.category,
                        author: script.author,
                        image: script.imgurLink
                    });
                }

                res.json({ success: true, message: "Skript wurde genehmigt." });
            } catch (error) {
                res.status(500).json({ message: "Interner Serverfehler" });
            }
        });

        app.post("/api/admin/scripts/reject/:scriptId", this.authenticateJWT.bind(this), this.authorize(), async (req, res) => {
            try {
                await this.scriptService.rejectScript(req.params.scriptId);
                res.json({ success: true, message: "Skript wurde abgelehnt und gel�scht." });
            } catch (error) {
                res.status(500).json({ message: "Interner Serverfehler" });
            }
        });
    }
}

export default ScriptController;