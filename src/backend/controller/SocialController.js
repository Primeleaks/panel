import jwt from 'jsonwebtoken';

class SocialController {
    constructor(services) {
        this.socialService = services.socialService;
        this.scriptService = services.scriptService;
        this.notificationService = services.notificationService;
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
            return res.status(403).json({ message: "Authentication required" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (err) {
            return res.status(403).json({ message: "Invalid or expired token" });
        }
    }

    registerRoutes(app) {
        // Activity Feed
        app.get("/api/feed", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const userId = req.user.discord_id;
                const limit = parseInt(req.query.limit) || 50;

                const feed = await this.socialService.getActivityFeed(userId, limit);
                res.json(feed);
            } catch (error) {
                console.error("Error fetching activity feed:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Collections
        app.post("/api/collections", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const userId = req.user.discord_id;
                const { name, description, isPublic = true } = req.body;

                if (!name || name.trim().length === 0) {
                    return res.status(400).json({ message: "Collection name is required" });
                }

                const collectionId = await this.socialService.createCollection(userId, name, description, isPublic);
                res.json({ 
                    message: "Collection created successfully", 
                    collectionId 
                });
            } catch (error) {
                console.error("Error creating collection:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        app.put("/api/collections/:collectionId", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const userId = req.user.discord_id;
                const { collectionId } = req.params;
                const { name, description, isPublic } = req.body;

                const success = await this.socialService.updateCollection(collectionId, userId, name, description, isPublic);
                
                if (success) {
                    res.json({ message: "Collection updated successfully" });
                } else {
                    res.status(404).json({ message: "Collection not found or unauthorized" });
                }
            } catch (error) {
                console.error("Error updating collection:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        app.delete("/api/collections/:collectionId", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const userId = req.user.discord_id;
                const { collectionId } = req.params;

                const success = await this.socialService.deleteCollection(collectionId, userId);
                
                if (success) {
                    res.json({ message: "Collection deleted successfully" });
                } else {
                    res.status(404).json({ message: "Collection not found or unauthorized" });
                }
            } catch (error) {
                console.error("Error deleting collection:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        app.get("/api/users/:userId/collections", async (req, res) => {
            try {
                const { userId } = req.params;
                const requestingUserId = req.user?.discord_id;
                const includePrivate = requestingUserId === userId;

                const collections = await this.socialService.getUserCollections(userId, includePrivate);
                res.json(collections);
            } catch (error) {
                console.error("Error fetching user collections:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        app.get("/api/collections/:collectionId", async (req, res) => {
            try {
                const { collectionId } = req.params;
                const requestingUserId = req.user?.discord_id;

                const collection = await this.socialService.getCollection(collectionId, requestingUserId);
                
                if (collection) {
                    res.json(collection);
                } else {
                    res.status(404).json({ message: "Collection not found or private" });
                }
            } catch (error) {
                console.error("Error fetching collection:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        app.post("/api/collections/:collectionId/scripts/:scriptId", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const userId = req.user.discord_id;
                const { collectionId, scriptId } = req.params;

                // Check if script exists
                const script = await this.scriptService.getScriptById(scriptId);
                if (!script || script.isDeleted || !script.isApproved) {
                    return res.status(404).json({ message: "Script not found" });
                }

                const success = await this.socialService.addScriptToCollection(collectionId, scriptId, userId);
                
                if (success) {
                    res.json({ message: "Script added to collection" });
                } else {
                    res.status(400).json({ message: "Script already in collection or unauthorized" });
                }
            } catch (error) {
                console.error("Error adding script to collection:", error);
                res.status(500).json({ message: error.message || "Internal server error" });
            }
        });

        app.delete("/api/collections/:collectionId/scripts/:scriptId", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const userId = req.user.discord_id;
                const { collectionId, scriptId } = req.params;

                const success = await this.socialService.removeScriptFromCollection(collectionId, scriptId, userId);
                
                if (success) {
                    res.json({ message: "Script removed from collection" });
                } else {
                    res.status(404).json({ message: "Script not in collection or unauthorized" });
                }
            } catch (error) {
                console.error("Error removing script from collection:", error);
                res.status(500).json({ message: error.message || "Internal server error" });
            }
        });

        app.get("/api/collections/:collectionId/scripts", async (req, res) => {
            try {
                const { collectionId } = req.params;
                const limit = parseInt(req.query.limit) || 20;
                const offset = parseInt(req.query.offset) || 0;

                const scripts = await this.socialService.getCollectionScripts(collectionId, limit, offset);
                res.json(scripts);
            } catch (error) {
                console.error("Error fetching collection scripts:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        // Bookmarks
        app.post("/api/bookmarks/:scriptId", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const userId = req.user.discord_id;
                const { scriptId } = req.params;

                // Check if script exists
                const script = await this.scriptService.getScriptById(scriptId);
                if (!script || script.isDeleted || !script.isApproved) {
                    return res.status(404).json({ message: "Script not found" });
                }

                const success = await this.socialService.addBookmark(userId, scriptId);
                
                if (success) {
                    res.json({ message: "Script bookmarked" });
                } else {
                    res.status(400).json({ message: "Script already bookmarked" });
                }
            } catch (error) {
                console.error("Error bookmarking script:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        app.delete("/api/bookmarks/:scriptId", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const userId = req.user.discord_id;
                const { scriptId } = req.params;

                const success = await this.socialService.removeBookmark(userId, scriptId);
                
                if (success) {
                    res.json({ message: "Bookmark removed" });
                } else {
                    res.status(404).json({ message: "Bookmark not found" });
                }
            } catch (error) {
                console.error("Error removing bookmark:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        app.get("/api/bookmarks/:scriptId/check", this.authenticateJWT.bind(this), async (req, res) => {
            try {
                const userId = req.user.discord_id;
                const { scriptId } = req.params;

                const isBookmarked = await this.socialService.isBookmarked(userId, scriptId);
                res.json({ isBookmarked });
            } catch (error) {
                console.error("Error checking bookmark:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        app.get("/api/users/:userId/bookmarks", async (req, res) => {
            try {
                const { userId } = req.params;
                const limit = parseInt(req.query.limit) || 20;
                const offset = parseInt(req.query.offset) || 0;

                // Only allow users to see their own bookmarks or make this admin-only
                if (req.user?.discord_id !== userId && !req.user?.isAdmin) {
                    return res.status(403).json({ message: "Unauthorized" });
                }

                const bookmarks = await this.socialService.getUserBookmarks(userId, limit, offset);
                res.json(bookmarks);
            } catch (error) {
                console.error("Error fetching user bookmarks:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
}

export default SocialController;
