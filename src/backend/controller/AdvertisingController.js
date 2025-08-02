import jwt from 'jsonwebtoken';

class AdvertisingController {
    constructor(services) {
        this.advertisingService = services.advertisingService;
        this.userService = services.userService;
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
                const user = await this.userService.findUserByDiscordId(decoded.discord_id);
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
    
    registerRoutes(app) {
        // Create new advertisement (admin only)
        app.post("/api/admin/ads", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const { label, text, url, image, type, is_active } = req.body;
                
                if (!label || !url) {
                    return res.status(400).json({ message: "Label and URL are required" });
                }
                
                const adId = await this.advertisingService.createAdvertisement({
                    label,
                    text: text || '',
                    url,
                    image: image || '',
                    type: type || 'popup',
                    is_active: is_active || false
                });
                
                res.status(201).json({ 
                    success: true, 
                    message: "Advertisement created successfully",
                    id: adId 
                });
            } catch (error) {
                console.error('Error creating advertisement:', error);
                res.status(500).json({ message: "Failed to create advertisement" });
            }
        });
        
        // Get all advertisements (admin only)
        app.get("/api/admin/ads", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const ads = await this.advertisingService.getAllAdvertisements();
                res.json(ads);
            } catch (error) {
                console.error('Error fetching advertisements:', error);
                res.status(500).json({ message: "Failed to fetch advertisements" });
            }
        });
        
        // Get advertisement statistics (admin only)
        app.get("/api/admin/ads/stats", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const stats = await this.advertisingService.getAdvertisementStats();
                res.json(stats);
            } catch (error) {
                console.error('Error fetching advertisement stats:', error);
                res.status(500).json({ message: "Failed to fetch advertisement stats" });
            }
        });
        
        // Toggle advertisement status (admin only)
        app.patch("/api/admin/ads/:id/toggle", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const { id } = req.params;
                await this.advertisingService.toggleAdvertisementStatus(id);
                res.json({ success: true, message: "Advertisement status updated" });
            } catch (error) {
                console.error('Error toggling advertisement status:', error);
                res.status(500).json({ message: "Failed to update advertisement status" });
            }
        });
        
        // Delete advertisement (admin only)
        app.delete("/api/admin/ads/:id", this.authenticateJWT.bind(this), this.requireAdmin.bind(this), async (req, res) => {
            try {
                const { id } = req.params;
                await this.advertisingService.deleteAdvertisement(id);
                res.json({ success: true, message: "Advertisement deleted successfully" });
            } catch (error) {
                console.error('Error deleting advertisement:', error);
                res.status(500).json({ message: "Failed to delete advertisement" });
            }
        });
        
        // Get active advertisements (public)
        app.get("/api/ads", async (req, res) => {
            try {
                const ads = await this.advertisingService.getActiveAdvertisements();
                res.json(ads);
            } catch (error) {
                console.error('Error fetching active advertisements:', error);
                res.status(500).json({ message: "Failed to fetch advertisements" });
            }
        });
        
        // Record advertisement click (public)
        app.post("/api/ads/:id/click", async (req, res) => {
            try {
                const { id } = req.params;
                const userId = req.user?.discord_id || null;
                const ipAddress = req.ip || req.connection.remoteAddress;
                
                await this.advertisingService.recordAdClick(id, userId, ipAddress);
                res.json({ success: true });
            } catch (error) {
                console.error('Error recording ad click:', error);
                res.status(500).json({ message: "Failed to record click" });
            }
        });
    }
}

export default AdvertisingController;
