import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

class SiteSettingsController {
    constructor(services) {
        this.userService = services.userService;
        this.settingsFile = path.join(process.cwd(), 'site-settings.json');
        
        // Default settings
        this.defaultSettings = {
            siteName: 'Hope Leaks',
            siteDescription: 'Die beste Quelle für FiveM Scripts',
            registrationEnabled: true,
            maintenanceMode: false,
            maxFileSize: 50,
            autoApproval: false,
            allowAnonymousDownloads: true,
            discordBotToken: process.env.DISCORD_BOT_TOKEN || '',
            webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
            discordNotifications: true,
            rateLimit: 100,
            requireEmailVerification: false,
            enableCaptcha: false
        };
    }
    
    authenticateJWT(req, res, next) {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid or expired token' });
            }

            try {
                const user = await this.userService.getUserByDiscordId(decoded.discordId);
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }
                req.user = user;
                next();
            } catch (error) {
                console.error('Error fetching user:', error);
                return res.status(500).json({ message: 'Internal server error' });
            }
        });
    }
    
    requireAdmin(req, res, next) {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: "Admin access required" });
        }
        next();
    }
    
    loadSettings() {
        try {
            if (fs.existsSync(this.settingsFile)) {
                const data = fs.readFileSync(this.settingsFile, 'utf8');
                return { ...this.defaultSettings, ...JSON.parse(data) };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        return this.defaultSettings;
    }
    
    saveSettings(settings) {
        try {
            const filteredSettings = { ...settings };
            // Don't save sensitive data to file
            delete filteredSettings.discordBotToken;
            
            fs.writeFileSync(this.settingsFile, JSON.stringify(filteredSettings, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }
    
    registerRoutes(app) {
        // Get site settings (admin only)
        app.get("/api/admin/settings", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const settings = this.loadSettings();
                res.json(settings);
            } catch (error) {
                console.error('Error fetching settings:', error);
                res.status(500).json({ message: "Failed to fetch settings" });
            }
        });
        
        // Update site settings (admin only)
        app.post("/api/admin/settings", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const newSettings = req.body;
                
                // Validate required fields
                if (!newSettings.siteName || !newSettings.siteDescription) {
                    return res.status(400).json({ message: "Site name and description are required" });
                }
                
                // Validate numeric fields
                if (newSettings.maxFileSize && (newSettings.maxFileSize < 1 || newSettings.maxFileSize > 100)) {
                    return res.status(400).json({ message: "Max file size must be between 1 and 100 MB" });
                }
                
                if (newSettings.rateLimit && (newSettings.rateLimit < 10 || newSettings.rateLimit > 1000)) {
                    return res.status(400).json({ message: "Rate limit must be between 10 and 1000" });
                }
                
                const currentSettings = this.loadSettings();
                const updatedSettings = { ...currentSettings, ...newSettings };
                
                if (this.saveSettings(updatedSettings)) {
                    res.json({ 
                        success: true, 
                        message: "Settings updated successfully",
                        settings: updatedSettings
                    });
                } else {
                    res.status(500).json({ message: "Failed to save settings" });
                }
                
            } catch (error) {
                console.error('Error updating settings:', error);
                res.status(500).json({ message: "Failed to update settings" });
            }
        });
        
        // Get public settings (for frontend usage)
        app.get("/api/settings/public", async (req, res) => {
            try {
                const settings = this.loadSettings();
                
                // Only return public settings
                const publicSettings = {
                    siteName: settings.siteName,
                    siteDescription: settings.siteDescription,
                    registrationEnabled: settings.registrationEnabled,
                    maintenanceMode: settings.maintenanceMode,
                    allowAnonymousDownloads: settings.allowAnonymousDownloads,
                    maxFileSize: settings.maxFileSize
                };
                
                res.json(publicSettings);
            } catch (error) {
                console.error('Error fetching public settings:', error);
                res.status(500).json({ message: "Failed to fetch settings" });
            }
        });
    }
}

export default SiteSettingsController;
